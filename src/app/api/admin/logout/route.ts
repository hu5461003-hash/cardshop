import { NextResponse } from "next/server";

// Admin 退出登录 API
// 清除认证 cookie
const COOKIE_NAME = "cardshop_admin_token";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "已退出登录" });

  // 清除 cookie
  response.cookies.set(COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
