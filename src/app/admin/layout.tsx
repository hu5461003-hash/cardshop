"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Key,
  ShoppingCart,
  Settings,
  Menu,
  X,
  LogOut,
  CreditCard,
  Users,
  MessageCircle,
} from "lucide-react";
import { t } from "@/lib/i18n";

const COOKIE_NAME = "cardshop_admin_token";

const navItems = [
  { href: "/admin", label: "admin.dashboard.title", icon: LayoutDashboard },
  { href: "/admin/products", label: "admin.products.title", icon: Package },
  { href: "/admin/cards", label: "admin.cards.title", icon: Key },
  { href: "/admin/orders", label: "admin.orders.title", icon: ShoppingCart },
  { href: "/admin/payments", label: "admin.payments.title", icon: CreditCard },
  { href: "/admin/agents", label: "admin.agents.title", icon: Users },
  { href: "/admin/chat", label: "admin.chat.title", icon: MessageCircle },
  { href: "/admin/settings", label: "admin.settings.title", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen flex bg-dark-1">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-2 border-r border-glass-border transform transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-glass-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-xs">CS</span>
            </div>
            <span className="text-light-3 font-semibold text-sm tracking-tight">
              管理后台
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-gray-4 hover:text-light-3 cursor-pointer"><X size={18} /></button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white/[0.06] text-light-3" : "text-gray-4 hover:text-light-3 hover:bg-glass-bg"}`}>
                <item.icon size={18} />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-glass-border space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors">
            <LogOut size={18} />
            返回前台
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-error/70 hover:text-error hover:bg-error/10 transition-colors cursor-pointer">
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>
      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-30 h-16 bg-dark-1/80 backdrop-blur-xl border-b border-glass-border flex items-center px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-gray-4 hover:text-light-3 cursor-pointer"><Menu size={18} /></button>
          <div className="flex-1" />
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-4 hover:text-error hover:bg-error/10 transition-colors cursor-pointer">
            <LogOut size={14} />
            退出
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
