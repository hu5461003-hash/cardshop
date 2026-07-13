import { NextRequest, NextResponse } from "next/server";
import { updateSettings } from "@/lib/mock-data";

// Favicon 上传 API
// 接收 base64 编码的图片，保存到 settings.faviconUrl
export async function POST(request: NextRequest) {
  try {
    const { faviconUrl } = await request.json();

    if (!faviconUrl) {
      return NextResponse.json(
        { success: false, message: "请上传图标" },
        { status: 400 }
      );
    }

    // 验证是 base64 图片
    if (!faviconUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, message: "仅支持图片格式" },
        { status: 400 }
      );
    }

    // 限制大小（base64 字符串不超过 500KB）
    if (faviconUrl.length > 500 * 1024) {
      return NextResponse.json(
        { success: false, message: "图标大小不能超过 100KB" },
        { status: 400 }
      );
    }

    updateSettings({ faviconUrl } as Partial<import("@/lib/mock-data").SiteSettings>);

    return NextResponse.json({ success: true, message: "图标已更新" });
  } catch {
    return NextResponse.json(
      { success: false, message: "上传失败" },
      { status: 500 }
    );
  }
}
