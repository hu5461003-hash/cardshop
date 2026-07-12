// ============================================
// 通用支付回调通知 API
// POST /api/payments/notify
// 接收支付平台回调数据，验证签名（模拟），更新订单状态，自动发卡
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  getStore,
  saveData,
  getAvailableStock,
} from "@/lib/mock-data";
import type { Order } from "@/lib/mock-data";

// ---------- 辅助函数 ----------

/**
 * 模拟签名验证
 * 在生产环境中，微信/支付宝/Stripe 各自有独立的签名验证机制
 * 这里仅做日志记录，演示模式下直接通过
 */
function verifySignature(payload: Record<string, unknown>): boolean {
  const { sign, signType, ...rest } = payload;

  // 演示模式：记录签名信息，始终返回 true
  console.log("[Payment Notify] 签名验证（模拟模式）:", {
    signType: signType || "unknown",
    sign: sign || "none",
    fields: Object.keys(rest),
  });

  return true;
}

/**
 * 自动发卡：从库存中分配卡密给订单
 * 将订单状态更新为 delivered，并标记卡密为已售出
 */
function autoDeliverCard(
  orderId: string,
  productId: string,
  quantity: number
): { success: boolean; cardContent?: string; error?: string } {
  const store = getStore();

  // 查找订单
  const orderIdx = store.orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) {
    return { success: false, error: "订单不存在" };
  }

  // 查找可用卡密
  const availableCards = store.cards.filter(
    (c) => c.productId === productId && !c.isSold
  );

  if (availableCards.length < quantity) {
    return {
      success: false,
      error: `可用卡密不足，需要 ${quantity} 张，仅剩 ${availableCards.length} 张`,
    };
  }

  // 分配卡密
  const assignedCards = availableCards.slice(0, quantity);
  const cardContent = assignedCards.map((c) => c.content).join("\n");

  // 更新卡密状态
  for (const card of assignedCards) {
    const cardIdx = store.cards.findIndex((c) => c.id === card.id);
    if (cardIdx !== -1) {
      store.cards[cardIdx].isSold = true;
      store.cards[cardIdx].orderId = orderId;
    }
  }

  // 更新订单状态为已发卡
  store.orders[orderIdx].status = "delivered";
  store.orders[orderIdx].cardContent = cardContent;
  store.orders[orderIdx].updatedAt = new Date().toISOString();

  saveData(store);

  return { success: true, cardContent };
}

// ---------- POST Handler ----------

export async function POST(request: NextRequest) {
  try {
    // 1. 解析回调数据
    const body = await request.json();
    const { orderNo, tradeNo, tradeStatus, amount, sign, signType } = body;

    // 2. 基本参数校验
    if (!orderNo || !tradeStatus) {
      console.error("[Payment Notify] 缺少必要参数:", body);
      return NextResponse.json(
        { code: "FAIL", message: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 3. 验证签名（模拟）
    const isValid = verifySignature(body);
    if (!isValid) {
      console.error("[Payment Notify] 签名验证失败:", body);
      return NextResponse.json(
        { code: "FAIL", message: "签名验证失败" },
        { status: 400 }
      );
    }

    // 4. 查找订单
    const orders = getOrders();
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) {
      console.error("[Payment Notify] 订单不存在:", orderNo);
      return NextResponse.json(
        { code: "FAIL", message: "订单不存在" },
        { status: 404 }
      );
    }

    // 5. 检查订单状态，防止重复处理
    if (order.status === "paid" || order.status === "delivered") {
      console.log("[Payment Notify] 订单已处理，跳过:", orderNo);
      return NextResponse.json({ code: "SUCCESS", message: "订单已处理" });
    }

    // 6. 判断支付状态
    // 不同平台的 tradeStatus 字段值不同，这里做兼容处理
    const successStatuses = ["SUCCESS", "TRADE_SUCCESS", "success", "paid", "succeeded"];
    const isSuccess = successStatuses.includes(tradeStatus);

    if (!isSuccess) {
      console.log("[Payment Notify] 支付未成功:", { orderNo, tradeStatus });
      // 更新订单状态为失败
      const store = getStore();
      const orderIdx = store.orders.findIndex((o) => o.id === order.id);
      if (orderIdx !== -1) {
        store.orders[orderIdx].status = "failed";
        store.orders[orderIdx].updatedAt = new Date().toISOString();
        saveData(store);
      }
      return NextResponse.json({ code: "SUCCESS", message: "已记录支付失败" });
    }

    // 7. 更新订单状态为已付款
    const store = getStore();
    const orderIdx = store.orders.findIndex((o) => o.id === order.id);
    if (orderIdx !== -1) {
      store.orders[orderIdx].status = "paid";
      store.orders[orderIdx].txId = tradeNo || `tx_${Date.now()}`;
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
      console.error("[Payment Notify] 自动发卡失败:", deliverResult.error);
      // 订单已付款但发卡失败，保持 paid 状态等待人工处理
      return NextResponse.json({
        code: "SUCCESS",
        message: "支付成功，但自动发卡失败，需人工处理",
      });
    }

    console.log(
      `[Payment Notify] 订单 ${orderNo} 支付成功，已自动发卡 ${order.quantity} 张`
    );

    // 9. 返回成功响应（不同平台要求不同的响应格式）
    // 微信/支付宝通常要求返回 XML 或特定格式的 success
    // 这里统一返回 JSON 格式
    return NextResponse.json({
      code: "SUCCESS",
      message: "支付成功，已自动发卡",
      data: {
        orderNo,
        status: "delivered",
      },
    });
  } catch (error) {
    console.error("[Payment Notify] 处理回调失败:", error);
    return NextResponse.json(
      { code: "FAIL", message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
