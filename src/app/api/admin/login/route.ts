import { NextRequest, NextResponse } from "next/server";

// Admin 登录 API
// 通过服务端设置 HttpOnly cookie，确保中间件能正确读取
const ADMIN_TOKEN = "cs_admin_2024_secure";
const COOKIE_NAME = "cardshop_admin_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 天

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 验证账号密码（生产环境应使用数据库 + bcrypt）
    if (username === "admin" && password === "admin123") {
      // 创建响应并设置 HttpOnly cookie
      const response = NextResponse.json({ success: true, message: "登录成功" });

      response.cookies.set(COOKIE_NAME, ADMIN_TOKEN, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "用户名或密码错误" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "请求格式错误" },
      { status: 400 }
    );
  }
}
