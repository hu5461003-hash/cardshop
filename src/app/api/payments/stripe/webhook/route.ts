// ============================================
// Stripe Webhook API
// POST /api/payments/stripe/webhook
// 接收 Stripe Webhook 事件，验证 stripe-signature header，更新订单状态，自动发卡
//
// Stripe 通过 webhook 发送支付事件通知
// 生产环境需使用 Stripe CLI 或 stripe.webhooks.constructEvent 验证签名
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  getStore,
  saveData,
} from "@/lib/mock-data";

// ---------- 辅助函数 ----------

/**
 * 验证 Stripe Webhook 签名
 * 生产环境应使用 stripe.webhooks.constructEvent() 方法：
 *   const event = stripe.webhooks.constructEvent(
 *     payload, sigHeader, webhookSecret
 *   );
 *
 * 签名格式: t=timestamp,v1=signature
 * 验证步骤:
 * 1. 从 stripe-signature header 提取 timestamp 和 signature
 * 2. 拼接待签名字符串: timestamp.rawBody
 * 3. 使用 webhookSecret HMAC-SHA256 计算签名
 * 4. 与 v1 签名对比
 */
function verifyStripeSignature(
  payload: string,
  sigHeader: string | null
): boolean {
  if (!sigHeader) {
    console.error("[Stripe Webhook] 缺少 stripe-signature header");
    return false;
  }

  // 演示模式：记录签名信息，始终返回 true
  console.log("[Stripe Webhook] 签名验证（模拟模式）:", {
    signatureHeader: sigHeader.substring(0, 50) + "...",
    payloadLength: payload.length,
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
    // 1. 获取原始请求体和签名 header
    // Stripe 需要原始请求体来验证签名
    const sigHeader = request.headers.get("stripe-signature");
    const rawBody = await request.text();

    // 2. 验证 Stripe 签名
    const isValid = verifyStripeSignature(rawBody, sigHeader);
    if (!isValid) {
      console.error("[Stripe Webhook] 签名验证失败");
      return NextResponse.json(
        { error: "签名验证失败" },
        { status: 400 }
      );
    }

    // 3. 解析事件数据
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      console.error("[Stripe Webhook] 无法解析事件数据");
      return NextResponse.json(
        { error: "无效的 JSON 数据" },
        { status: 400 }
      );
    }

    const eventType = event.type as string;
    const eventData = (event.data as Record<string, unknown> | undefined)?.object as Record<string, unknown> | undefined;

    console.log("[Stripe Webhook] 收到事件:", eventType);

    // 4. 处理不同类型的事件
    switch (eventType) {
      // Checkout Session 支付完成
      case "checkout.session.completed": {
        await handleCheckoutCompleted(eventData);
        break;
      }

      // 支付意图支付成功
      case "payment_intent.succeeded": {
        await handlePaymentIntentSucceeded(eventData);
        break;
      }

      // 支付失败
      case "payment_intent.payment_failed": {
        await handlePaymentFailed(eventData);
        break;
      }

      // 退款事件
      case "charge.refunded": {
        await handleRefunded(eventData);
        break;
      }

      default:
        console.log("[Stripe Webhook] 未处理的事件类型:", eventType);
    }

    // 5. 返回成功响应（Stripe 要求 200）
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] 处理 webhook 失败:", error);
    return NextResponse.json(
      { error: "Webhook 处理失败" },
      { status: 500 }
    );
  }
}

// ---------- 事件处理函数 ----------

/**
 * 处理 Checkout Session 完成事件
 * 当用户通过 Stripe Checkout 完成支付时触发
 */
async function handleCheckoutCompleted(session: Record<string, unknown> | undefined) {
  if (!session) return;

  // 从 session 的 metadata 中获取订单号
  const metadata = session.metadata as Record<string, string> | undefined;
  const orderNo = metadata?.orderNo || metadata?.order_no;

  if (!orderNo) {
    console.error("[Stripe Webhook] checkout.session.completed 缺少 orderNo");
    return;
  }

  const paymentIntentId = session.payment_intent as string | undefined;
  const sessionId = session.id as string;

  console.log("[Stripe Webhook] Checkout 完成:", { orderNo, sessionId, paymentIntentId });

  // 查找并处理订单
  processSuccessfulPayment(orderNo, paymentIntentId || `pi_${sessionId}`);
}

/**
 * 处理 Payment Intent 支付成功事件
 * 当支付意图状态变为 succeeded 时触发
 */
async function handlePaymentIntentSucceeded(paymentIntent: Record<string, unknown> | undefined) {
  if (!paymentIntent) return;

  const metadata = paymentIntent.metadata as Record<string, string> | undefined;
  const orderNo = metadata?.orderNo || metadata?.order_no;

  if (!orderNo) {
    console.error("[Stripe Webhook] payment_intent.succeeded 缺少 orderNo");
    return;
  }

  const paymentIntentId = paymentIntent.id as string;

  console.log("[Stripe Webhook] Payment Intent 成功:", { orderNo, paymentIntentId });

  processSuccessfulPayment(orderNo, paymentIntentId);
}

/**
 * 处理支付失败事件
 */
async function handlePaymentFailed(paymentIntent: Record<string, unknown> | undefined) {
  if (!paymentIntent) return;

  const metadata = paymentIntent.metadata as Record<string, string> | undefined;
  const orderNo = metadata?.orderNo || metadata?.order_no;

  if (!orderNo) {
    console.error("[Stripe Webhook] payment_intent.payment_failed 缺少 orderNo");
    return;
  }

  console.log("[Stripe Webhook] 支付失败:", orderNo);

  const store = getStore();
  const orders = getOrders();
  const order = orders.find((o) => o.orderNo === orderNo);

  if (order && order.status === "pending") {
    const orderIdx = store.orders.findIndex((o) => o.id === order.id);
    if (orderIdx !== -1) {
      store.orders[orderIdx].status = "failed";
      store.orders[orderIdx].updatedAt = new Date().toISOString();
      saveData(store);
    }
  }
}

/**
 * 处理退款事件
 */
async function handleRefunded(charge: Record<string, unknown> | undefined) {
  if (!charge) return;

  const metadata = charge.metadata as Record<string, string> | undefined;
  const orderNo = metadata?.orderNo || metadata?.order_no;

  if (!orderNo) {
    console.error("[Stripe Webhook] charge.refunded 缺少 orderNo");
    return;
  }

  console.log("[Stripe Webhook] 退款:", orderNo);

  const store = getStore();
  const orders = getOrders();
  const order = orders.find((o) => o.orderNo === orderNo);

  if (order) {
    const orderIdx = store.orders.findIndex((o) => o.id === order.id);
    if (orderIdx !== -1) {
      store.orders[orderIdx].status = "refunded";
      store.orders[orderIdx].updatedAt = new Date().toISOString();
      saveData(store);
    }
  }
}

/**
 * 通用支付成功处理：更新订单状态并自动发卡
 */
function processSuccessfulPayment(orderNo: string, txId: string) {
  const store = getStore();
  const orders = getOrders();
  const order = orders.find((o) => o.orderNo === orderNo);

  if (!order) {
    console.error("[Stripe Webhook] 订单不存在:", orderNo);
    return;
  }

  // 防止重复处理
  if (order.status === "paid" || order.status === "delivered") {
    console.log("[Stripe Webhook] 订单已处理，跳过:", orderNo);
    return;
  }

  // 更新订单状态为已付款
  const orderIdx = store.orders.findIndex((o) => o.id === order.id);
  if (orderIdx !== -1) {
    store.orders[orderIdx].status = "paid";
    store.orders[orderIdx].txId = txId;
    store.orders[orderIdx].updatedAt = new Date().toISOString();
    saveData(store);
  }

  // 自动发卡
  const deliverResult = autoDeliverCard(
    order.id,
    order.productId,
    order.quantity
  );

  if (!deliverResult.success) {
    console.error("[Stripe Webhook] 自动发卡失败:", deliverResult.error);
    return;
  }

  console.log(
    `[Stripe Webhook] 订单 ${orderNo} 支付成功，已自动发卡 ${order.quantity} 张`
  );
}
