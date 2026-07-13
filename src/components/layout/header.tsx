"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, Globe } from "lucide-react";
import { useLocaleStore } from "@/store/use-locale-store";
import { t } from "@/lib/i18n";
import { getSettings } from "@/lib/mock-data";

export default function Header() {
  const { locale, setLocale } = useLocaleStore();
  const [siteName, setSiteName] = useState(t("common.siteName"));

  useEffect(() => {
    const s = getSettings();
    if (s.siteName) setSiteName(s.siteName);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-glass-border bg-dark-1/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">CS</span>
          </div>
          <span className="text-light-3 font-semibold text-lg tracking-tight">
            {siteName}
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-gray-4 hover:text-light-3 transition-colors">
            {t("header.products")}
          </Link>
          <Link href="/order/query" className="text-sm text-gray-4 hover:text-light-3 transition-colors">
            {t("header.trackOrder")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer">
            <Search size={18} />
          </button>
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-4 hover:text-light-3 hover:bg-glass-bg border border-glass-border transition-colors cursor-pointer"
          >
            <Globe size={14} />
            {locale === "zh" ? "EN" : "中"}
          </button>
          <button className="md:hidden p-2 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
