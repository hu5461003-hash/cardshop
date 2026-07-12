// ============================================
// 微信支付专用回调 API
// POST /api/payments/wechat/notify
// 接收微信支付异步通知，验证签名（模拟），更新订单状态，自动发卡
//
// 微信支付回调通常以 XML 格式发送，这里演示模式使用 JSON
// 生产环境需使用微信支付 V3 API 的签名验证
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  getStore,
  saveData,
} from "@/lib/mock-data";

// ---------- 辅助函数 ----------

/**
 * 模拟微信支付签名验证
 * 生产环境应使用微信支付 V3 的 AEAD_AES_256_GCM 解密通知报文
 * 并使用平台证书验证签名
 */
function verifyWechatSignature(body: Record<string, unknown>): boolean {
  const { transaction_id, out_trade_no, trade_state, sign } = body;

  // 演示模式：记录微信回调信息，始终返回 true
  console.log("[WeChat Notify] 微信支付回调（模拟模式）:", {
    transaction_id,
    out_trade_no,
    trade_state,
    sign: sign || "none",
  });

  return true;
}

/**
 * 自动发卡：从库存中分配卡密给订单
 */
function autoDeliverCard(
  orderId: string,
  productId: string,
  quantity: number
): { success: boolean; cardContent?: string; error?: string } {
  const store = getStore();

  const orderIdx = store.orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) {
    return { success: false, error: "订单不存在" };
  }

  const availableCards = store.cards.filter(
    (c) => c.productId === productId && !c.isSold
  );

  if (availableCards.length < quantity) {
    return {
      success: false,
      error: `可用卡密不足，需要 ${quantity} 张，仅剩 ${availableCards.length} 张`,
    };
  }

  const assignedCards = availableCards.slice(0, quantity);
  const cardContent = assignedCards.map((c) => c.content).join("\n");

  for (const card of assignedCards) {
    const cardIdx = store.cards.findIndex((c) => c.id === card.id);
    if (cardIdx !== -1) {
      store.cards[cardIdx].isSold = true;
      store.cards[cardIdx].orderId = orderId;
    }
  }

  store.orders[orderIdx].status = "delivered";
  store.orders[orderIdx].cardContent = cardContent;
  store.orders[orderIdx].updatedAt = new Date().toISOString();

  saveData(store);

  return { success: true, cardContent };
}

// ---------- POST Handler ----------

export async function POST(request: NextRequest) {
  try {
    // 1. 解析微信支付回调数据
    // 生产环境：微信 V3 使用 JSON 格式；V2 使用 XML 格式
    const body = await request.json();

    // 微信支付回调字段映射
    const {
      out_trade_no,    // 商户订单号（对应我们的 orderNo）
      transaction_id,  // 微信支付交易号
      trade_state,     // 交易状态: SUCCESS / NOTPAY / CLOSED / REFUND 等
      amount,          // 订单金额（V3 格式）
      total_fee,       // 订单金额（V2 格式，单位：分）
      sign,            // 签名
    } = body;

    // 2. 参数校验
    if (!out_trade_no || !trade_state) {
      console.error("[WeChat Notify] 缺少必要参数:", body);
      return NextResponse.json(
        { code: "FAIL", message: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 3. 验证签名（模拟）
    const isValid = verifyWechatSignature(body);
    if (!isValid) {
      console.error("[WeChat Notify] 签名验证失败:", body);
      return NextResponse.json(
        { code: "FAIL", message: "签名验证失败" },
        { status: 400 }
      );
    }

    // 4. 查找订单
    const orders = getOrders();
    const order = orders.find((o) => o.orderNo === out_trade_no);
    if (!order) {
      console.error("[WeChat Notify] 订单不存在:", out_trade_no);
      return NextResponse.json(
        { code: "FAIL", message: "订单不存在" },
        { status: 404 }
      );
    }

    // 5. 防止重复处理
    if (order.status === "paid" || order.status === "delivered") {
      console.log("[WeChat Notify] 订单已处理，跳过:", out_trade_no);
      return NextResponse.json({ code: "SUCCESS", message: "订单已处理" });
    }

    // 6. 判断支付状态
    if (trade_state !== "SUCCESS") {
      console.log("[WeChat Notify] 支付未成功:", { out_trade_no, trade_state });
      const store = getStore();
      const orderIdx = store.orders.findIndex((o) => o.id === order.id);
      if (orderIdx !== -1) {
        store.orders[orderIdx].status = "failed";
        store.orders[orderIdx].updatedAt = new Date().toISOString();
        saveData(store);
      }
      return NextResponse.json({ code: "SUCCESS", message: "已记录支付状态" });
    }

    // 7. 更新订单状态为已付款
    const store = getStore();
    const orderIdx = store.orders.findIndex((o) => o.id === order.id);
    if (orderIdx !== -1) {
      store.orders[orderIdx].status = "paid";
      store.orders[orderIdx].txId = transaction_id || `wx_${Date.now()}`;
      store.orders[orderIdx].updatedAt = new Date().toISOString();
      saveData(store);
    }

    // 8. 自动发卡
    const deliverResult = autoDeliverCard(
      order.id,
      order.productId,
      order.quantity
    );

    if (!deliverResult.success) {
      console.error("[WeChat Notify] 自动发卡失败:", deliverResult.error);
      return NextResponse.json({
        code: "SUCCESS",
        message: "支付成功，但自动发卡失败，需人工处理",
      });
    }

    console.log(
      `[WeChat Notify] 微信支付订单 ${out_trade_no} 已完成，交易号: ${transaction_id}，已自动发卡`
    );

    // 9. 微信支付要求返回 JSON 格式的成功响应
    return NextResponse.json({
      code: "SUCCESS",
      message: "成功",
    });
  } catch (error) {
    console.error("[WeChat Notify] 处理微信回调失败:", error);
    return NextResponse.json(
      { code: "FAIL", message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
