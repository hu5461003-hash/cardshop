// ============================================
// USDT 链上验证 API
// POST /api/payments/crypto/verify
// 验证 USDT-TRC20 链上转账，确认付款后更新订单状态，自动发卡
//
// 生产环境应调用 TronGrid / TronScan API 查询链上交易
// 或使用第三方服务（如 NowPayments, CoinPayments）的回调
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  getOrders,
  getStore,
  saveData,
  getActivePaymentChannels,
} from "@/lib/mock-data";

// ---------- 辅助函数 ----------

/**
 * 模拟链上交易查询
 * 生产环境应调用 TronGrid API 验证交易:
 *   GET https://api.trongrid.io/v1/accounts/{address}/transactions/trc20
 *   或使用 TronWeb SDK 查询交易详情
 *
 * 验证要点:
 * 1. 交易存在且已确认（达到指定确认数）
 * 2. 转入地址为商户收款地址
 * 3. 转出地址非商户地址（防止自转）
 * 4. 转账金额 >= 订单金额
 * 5. token 为 USDT (TRC20: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
 */
async function verifyOnChainTransaction(params: {
  txId: string;
  walletAddress: string;
  expectedAmount: number;
  confirmations: number;
}): Promise<{
  verified: boolean;
  actualAmount?: number;
  fromAddress?: string;
  blockNumber?: number;
  error?: string;
}> {
  const { txId, walletAddress, expectedAmount, confirmations } = params;

  // 演示模式：模拟链上查询结果
  console.log("[Crypto Verify] 链上查询（模拟模式）:", {
    txId,
    walletAddress,
    expectedAmount,
    requiredConfirmations: confirmations,
  });

  // 模拟：交易验证通过
  return {
    verified: true,
    actualAmount: expectedAmount,
    fromAddress: "T" + Math.random().toString(36).substr(2, 33),
    blockNumber: 35000000 + Math.floor(Math.random() * 1000000),
  };
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
    // 1. 解析请求参数
    const body = await request.json();
    const { orderNo, txId } = body;

    // 2. 参数校验
    if (!orderNo || !txId) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数: orderNo, txId" },
        { status: 400 }
      );
    }

    // 交易 ID 格式校验（TRC20 交易 hash 通常为 64 位十六进制字符串）
    if (!/^0x[a-fA-F0-9]{64}$/.test(txId) && txId.length !== 64) {
      console.warn("[Crypto Verify] 交易 ID 格式可能不正确:", txId);
      // 演示模式不严格校验格式
    }

    // 3. 查找订单
    const orders = getOrders();
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "订单不存在" },
        { status: 404 }
      );
    }

    // 4. 检查订单支付方式是否为 crypto
    if (order.paymentMethod !== "crypto") {
      return NextResponse.json(
        { success: false, error: "该订单不是加密货币支付订单" },
        { status: 400 }
      );
    }

    // 5. 防止重复处理
    if (order.status === "paid" || order.status === "delivered") {
      return NextResponse.json({
        success: true,
        message: "订单已处理",
        data: {
          orderNo,
          status: order.status,
        },
      });
    }

    // 6. 获取支付通道配置（读取收款地址和确认数）
    const channels = getActivePaymentChannels();
    const cryptoChannel = channels.find((ch) => ch.code === "crypto");
    const walletAddress = cryptoChannel?.config.walletAddress || "";
    const requiredConfirmations = parseInt(
      cryptoChannel?.config.confirmations || "3",
      10
    );

    if (!walletAddress) {
      console.error("[Crypto Verify] 未配置 USDT 收款地址");
      return NextResponse.json(
        { success: false, error: "系统未配置加密货币收款地址" },
        { status: 500 }
      );
    }

    // 7. 链上交易验证（模拟）
    const verifyResult = await verifyOnChainTransaction({
      txId,
      walletAddress,
      expectedAmount: order.totalAmount,
      confirmations: requiredConfirmations,
    });

    if (!verifyResult.verified) {
      console.log("[Crypto Verify] 链上验证未通过:", verifyResult.error);
      return NextResponse.json({
        success: false,
        error: verifyResult.error || "链上交易验证失败",
        data: {
          orderNo,
          txId,
          verified: false,
        },
      });
    }

    // 8. 验证金额是否匹配（允许 1% 的误差）
    const actualAmount = verifyResult.actualAmount || 0;
    const minAmount = order.totalAmount * 0.99;
    if (actualAmount < minAmount) {
      console.error("[Crypto Verify] 金额不匹配:", {
        expected: order.totalAmount,
        actual: actualAmount,
      });
      return NextResponse.json({
        success: false,
        error: `转账金额不足，期望 ${order.totalAmount} USDT，实际 ${actualAmount} USDT`,
        data: {
          orderNo,
          txId,
          verified: false,
          actualAmount,
        },
      });
    }

    // 9. 更新订单状态为已付款
    const store = getStore();
    const orderIdx = store.orders.findIndex((o) => o.id === order.id);
    if (orderIdx !== -1) {
      store.orders[orderIdx].status = "paid";
      store.orders[orderIdx].txId = txId;
      store.orders[orderIdx].updatedAt = new Date().toISOString();
      saveData(store);
    }

    // 10. 自动发卡
    const deliverResult = autoDeliverCard(
      order.id,
      order.productId,
      order.quantity
    );

    if (!deliverResult.success) {
      console.error("[Crypto Verify] 自动发卡失败:", deliverResult.error);
      return NextResponse.json({
        success: true,
        message: "链上验证通过，但自动发卡失败，需人工处理",
        data: {
          orderNo,
          txId,
          status: "paid",
          fromAddress: verifyResult.fromAddress,
          actualAmount,
        },
      });
    }

    console.log(
      `[Crypto Verify] USDT 订单 ${orderNo} 验证通过，交易号: ${txId}，已自动发卡`
    );

    // 11. 返回验证成功结果
    return NextResponse.json({
      success: true,
      message: "链上验证通过，已自动发卡",
      data: {
        orderNo,
        txId,
        status: "delivered",
        fromAddress: verifyResult.fromAddress,
        actualAmount,
        blockNumber: verifyResult.blockNumber,
      },
    });
  } catch (error) {
    console.error("[Crypto Verify] 处理验证请求失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误，请稍后重试" },
      { status: 500 }
    );
  }
}
