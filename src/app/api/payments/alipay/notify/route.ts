// ============================================
// 支付宝专用回调 API
// POST /api/payments/alipay/notify
// 接收支付宝异步通知，验证签名（模拟），更新订单状态，自动发卡
//
// 支付宝回调通常以 form-urlencoded 格式发送
// 生产环境需使用 RSA2 签名验证
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  getStore,
  saveData,
} from "@/lib/mock-data";

// ---------- 辅助函数 ----------

/**
 * 模拟支付宝签名验证
 * 生产环境应使用支付宝公钥对 sign 字段进行 RSA2 验签
 * 验签步骤：
 * 1. 剔除 sign 和 sign_type 参数
 * 2. 将剩余参数按 key 的 ASCII 码升序排列
 * 3. 拼接成待签名字符串
 * 4. 使用支付宝公钥验签
 */
function verifyAlipaySignature(body: Record<string, unknown>): boolean {
  const { sign, sign_type, trade_status, out_trade_no, trade_no } = body;

  // 演示模式：记录支付宝回调信息，始终返回 true
  console.log("[Alipay Notify] 支付宝回调（模拟模式）:", {
    trade_no,
    out_trade_no,
    trade_status,
    sign_type: sign_type || "RSA2",
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
    // 1. 解析支付宝回调数据
    // 生产环境：支付宝以 application/x-www-form-urlencoded 格式发送
    // 演示模式使用 JSON 格式
    const body = await request.json();

    // 支付宝回调字段映射
    const {
      out_trade_no,    // 商户订单号（对应我们的 orderNo）
      trade_no,         // 支付宝交易号
      trade_status,     // 交易状态: TRADE_SUCCESS / TRADE_FINISHED / WAIT_BUYER_PAY
      total_amount,     // 订单金额（元）
      buyer_id,         // 买家支付宝用户号
      gmt_payment,      // 交易付款时间
      sign,             // 签名
      sign_type,        // 签名类型: RSA2
    } = body;

    // 2. 参数校验
    if (!out_trade_no || !trade_status) {
      console.error("[Alipay Notify] 缺少必要参数:", body);
      return NextResponse.json(
        { success: false, message: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 3. 验证签名（模拟）
    const isValid = verifyAlipaySignature(body);
    if (!isValid) {
      console.error("[Alipay Notify] 签名验证失败:", body);
      return NextResponse.json(
        { success: false, message: "签名验证失败" },
        { status: 400 }
      );
    }

    // 4. 查找订单
    const orders = getOrders();
    const order = orders.find((o) => o.orderNo === out_trade_no);
    if (!order) {
      console.error("[Alipay Notify] 订单不存在:", out_trade_no);
      return NextResponse.json(
        { success: false, message: "订单不存在" },
        { status: 404 }
      );
    }

    // 5. 防止重复处理
    if (order.status === "paid" || order.status === "delivered") {
      console.log("[Alipay Notify] 订单已处理，跳过:", out_trade_no);
      // 支付宝要求返回 "success" 字符串
      return new NextResponse("success", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 6. 判断支付状态
    // TRADE_SUCCESS: 交易支付成功
    // TRADE_FINISHED: 交易结束，不可退款
    const successStatuses = ["TRADE_SUCCESS", "TRADE_FINISHED"];
    const isSuccess = successStatuses.includes(trade_status);

    if (!isSuccess) {
      console.log("[Alipay Notify] 支付未成功:", { out_trade_no, trade_status });
      const store = getStore();
      const orderIdx = store.orders.findIndex((o) => o.id === order.id);
      if (orderIdx !== -1) {
        store.orders[orderIdx].status = "failed";
        store.orders[orderIdx].updatedAt = new Date().toISOString();
        saveData(store);
      }
      // 支付宝要求即使失败也返回 "success"，否则会重复通知
      return new NextResponse("success", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 7. 更新订单状态为已付款
    const store = getStore();
    const orderIdx = store.orders.findIndex((o) => o.id === order.id);
    if (orderIdx !== -1) {
      store.orders[orderIdx].status = "paid";
      store.orders[orderIdx].txId = trade_no || `alipay_${Date.now()}`;
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
      console.error("[Alipay Notify] 自动发卡失败:", deliverResult.error);
      // 支付宝要求返回 "success" 避免重复通知
      return new NextResponse("success", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.log(
      `[Alipay Notify] 支付宝订单 ${out_trade_no} 已完成，交易号: ${trade_no}，已自动发卡`
    );

    // 9. 支付宝要求回调返回纯文本 "success"
    return new NextResponse("success", {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[Alipay Notify] 处理支付宝回调失败:", error);
    // 支付宝要求即使出错也返回 "success"，否则会持续重试
    return new NextResponse("success", {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
