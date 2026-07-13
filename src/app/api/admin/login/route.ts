import { NextRequest, NextResponse } from "next/server";
import { getSettings, getAdminToken } from "@/lib/mock-data";

const COOKIE_NAME = "cardshop_admin_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const settings = getSettings();
    const validToken = getAdminToken();

    if (username === settings.adminUsername && password === settings.adminPassword) {
      const response = NextResponse.json({ success: true, message: "登录成功" });
      response.cookies.set(COOKIE_NAME, validToken, {
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
