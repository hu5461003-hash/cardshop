// ============================================
// 支付状态查询 API
// GET /api/payments/status?orderNo=xxx
// 返回订单当前状态和卡密内容（如果已发卡）
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getOrderByNoOrEmail } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get("orderNo");

    if (!orderNo) {
      return NextResponse.json(
        { success: false, error: "缺少 orderNo 参数" },
        { status: 400 }
      );
    }

    const order = getOrderByNoOrEmail(orderNo);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "订单不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNo: order.orderNo,
        status: order.status,
        cardContent: order.cardContent,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("[Payment Status] 查询订单状态失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误，请稍后重试" },
      { status: 500 }
    );
  }
}
