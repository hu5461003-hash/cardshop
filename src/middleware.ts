import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin 认证中间件
// 保护 /admin 路由，未登录用户重定向到 /admin/login
const ADMIN_COOKIE = "cardshop_admin_token";
const ADMIN_TOKEN = "cs_admin_2024_secure"; // 模拟 token，生产环境应使用 JWT

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只拦截 /admin 路由（排除 /admin/login）
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    if (!token || token !== ADMIN_TOKEN) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 如果已登录，访问 /admin/login 时重定向到 /admin
  if (pathname === "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token && token === ADMIN_TOKEN) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
