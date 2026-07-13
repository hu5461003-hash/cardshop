import { NextRequest, NextResponse } from "next/server";
import { updateAdminCredentials } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password || username.length < 3 || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "用户名至少3位，密码至少6位" },
        { status: 400 }
      );
    }

    updateAdminCredentials(username, password);

    // 清除当前登录 cookie，强制重新登录
    const response = NextResponse.json({ success: true, message: "密码已更新，请重新登录" });
    response.cookies.set("cardshop_admin_token", "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "更新失败" },
      { status: 500 }
    );
  }
}
