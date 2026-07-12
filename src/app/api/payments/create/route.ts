// ============================================
// 统一创建支付订单 API
// POST /api/payments/create
// 接收: productId, quantity, email, paymentMethod
// 根据 paymentMethod 返回对应的支付参数
// ============================================

import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  getAvailableStock,
  getActivePaymentChannels,
  createOrder,
  getStore,
  saveData,
} from "@/lib/mock-data";
import type { Order, PaymentChannel } from "@/lib/mock-data";

// ---------- 辅助函数 ----------

/**
 * 生成模拟的微信支付二维码 URL（演示模式）
 */
function generateWechatQRCode(orderNo: string, amount: number): string {
  // 演示模式：返回模拟的微信支付二维码链接
  return `weixin://wxpay/bizpayurl?pr=${orderNo}&amount=${amount}`;
}

/**
 * 生成模拟的支付宝跳转 URL（演示模式）
 */
function generateAlipayRedirectUrl(orderNo: string, amount: number): string {
  // 演示模式：返回模拟的支付宝网关跳转链接
  return `https://openapi.alipay.com/gateway.do?orderId=${orderNo}&amount=${amount}&method=alipay.trade.page.pay`;
}

/**
 * 生成模拟的 Stripe Checkout Session（演示模式）
 */
function generateStripeSession(orderNo: string, amount: number): {
  sessionId: string;
  publishableKey: string;
} {
  // 演示模式：返回模拟的 Stripe session 信息
  const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  const publishableKey = "pk_test_demo_cardshop";
  return { sessionId, publishableKey };
}

/**
 * 生成加密货币支付参数（演示模式）
 */
function generateCryptoParams(
  orderNo: string,
  amount: number,
  channel: PaymentChannel
): {
  walletAddress: string;
  network: string;
  amount: string;
  orderNo: string;
} {
  // 从支付通道配置中读取钱包地址和网络
  const walletAddress =
    channel.config.walletAddress || "TJxR4f8mQbFNfPcisK2RgHMPsVbFZJhY9x";
  const network = channel.config.network || "TRC20";

  // 演示模式：USDT 金额与 USD 1:1
  return {
    walletAddress,
    network,
    amount: amount.toFixed(2),
    orderNo,
  };
}

// ---------- POST Handler ----------

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    const { productId, quantity, email, paymentMethod } = body;

    // 2. 参数校验
    if (!productId || !quantity || !email || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数: productId, quantity, email, paymentMethod" },
        { status: 400 }
      );
    }

    if (!["wechat", "alipay", "stripe", "crypto"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "不支持的支付方式，可选: wechat, alipay, stripe, crypto" },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { success: false, error: "购买数量必须在 1-100 之间" },
        { status: 400 }
      );
    }

    // 简单的邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 3. 读取商品信息
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "商品不存在" },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: "商品已下架" },
        { status: 400 }
      );
    }

    // 4. 检查库存
    const availableStock = getAvailableStock(productId);
    if (availableStock < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `库存不足，当前可用库存: ${availableStock}`,
        },
        { status: 400 }
      );
    }

    // 5. 检查支付通道是否启用
    const channels = getActivePaymentChannels();
    const paymentChannel = channels.find((ch) => ch.code === paymentMethod);
    if (!paymentChannel) {
      return NextResponse.json(
        { success: false, error: `支付通道 ${paymentMethod} 未启用或不存在` },
        { status: 400 }
      );
    }

    // 6. 计算订单金额
    const unitPrice = product.price;
    const totalAmount = Number((unitPrice * quantity).toFixed(2));

    // 7. 创建订单（pending 状态）
    const order = createOrder({
      email,
      productId,
      quantity,
      unitPrice,
      totalAmount,
      paymentMethod: paymentMethod as Order["paymentMethod"],
      status: "pending",
      cardContent: null,
      txId: null,
    });

    // 8. 根据 paymentMethod 生成对应的支付参数
    let paymentParams: Record<string, unknown> = {};

    switch (paymentMethod) {
      case "wechat": {
        // 微信支付：返回二维码 URL
        const codeUrl = generateWechatQRCode(order.orderNo, totalAmount);
        paymentParams = {
          type: "qrcode",
          codeUrl,
          orderNo: order.orderNo,
        };
        break;
      }

      case "alipay": {
        // 支付宝：返回跳转 URL
        const payUrl = generateAlipayRedirectUrl(order.orderNo, totalAmount);
        paymentParams = {
          type: "redirect",
          payUrl,
          orderNo: order.orderNo,
        };
        break;
      }

      case "stripe": {
        // Stripe：返回 checkout session
        const { sessionId, publishableKey } = generateStripeSession(
          order.orderNo,
          totalAmount
        );
        paymentParams = {
          type: "checkout",
          sessionId,
          publishableKey,
          orderNo: order.orderNo,
        };
        break;
      }

      case "crypto": {
        // 加密货币：返回钱包地址和转账信息
        const cryptoInfo = generateCryptoParams(order.orderNo, totalAmount, paymentChannel);
        paymentParams = {
          type: "transfer",
          walletAddress: cryptoInfo.walletAddress,
          network: cryptoInfo.network,
          amount: cryptoInfo.amount,
          orderNo: order.orderNo,
        };
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, error: "不支持的支付方式" },
          { status: 400 }
        );
      }
    }

    // 9. 返回订单和支付参数
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.orderNo,
        totalAmount: order.totalAmount,
        paymentMethod,
        ...paymentParams,
      },
    });
  } catch (error) {
    console.error("[Payment Create] 创建支付订单失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误，请稍后重试" },
      { status: 500 }
    );
  }
}
