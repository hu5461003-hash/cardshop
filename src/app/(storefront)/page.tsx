"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle, Bird, Mail, Camera, Gamepad2, Music2,
  ArrowRight, Search, Shield, Zap, Package,
} from "lucide-react";
import { useLocaleStore } from "@/store/use-locale-store";
import { t } from "@/lib/i18n";
import { getCategories, getProducts, getAvailableStock, getSettings } from "@/lib/mock-data";

const categoryIcons: Record<string, React.ReactNode> = {
  telegram: <MessageCircle size={24} />,
  twitter: <Bird size={24} />,
  google: <Mail size={24} />,
  instagram: <Camera size={24} />,
  discord: <Gamepad2 size={24} />,
  tiktok: <Music2 size={24} />,
};

export default function HomePage() {
  const { locale } = useLocaleStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(getSettings());

  useEffect(() => {
    setCategories(getCategories().filter((c) => c.isActive));
    setProducts(getProducts().filter((p) => p.isActive));
    setSettings(getSettings());
  }, []);

  const features = [
    { icon: <Zap size={20} />, title: t("home.featureInstant"), desc: t("home.featureInstantDesc") },
    { icon: <Shield size={20} />, title: t("home.featureEncrypted"), desc: t("home.featureEncryptedDesc") },
    { icon: <Package size={20} />, title: t("home.featureVerified"), desc: t("home.featureVerifiedDesc") },
  ];

  return (
    <div className="min-h-screen">
      {/* Announcement Bar */}
      {settings.announcement && (
        <div className="bg-white/[0.03] border-b border-glass-border">
          <div className="max-w-7xl mx-auto px-6 py-2.5 text-center">
            <p className="text-sm text-gray-4">{settings.announcement}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-28 md:py-36 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />
        <div className="relative text-center max-w-3xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-glass-border mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-gray-4">{t("home.systemStatus")}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-light-3 mb-6 leading-[1.1]">
            {t("home.heroTitle1")}<br /><span className="text-gray-4">{t("home.heroTitle2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-3 max-w-xl mx-auto mb-10 leading-relaxed">{t("home.heroDesc")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#products" className="btn-primary text-sm flex items-center gap-2">{t("home.browseProducts")} <ArrowRight size={16} /></a>
            <Link href="/order/query" className="btn-secondary text-sm flex items-center gap-2"><Search size={16} /> {t("home.trackOrder")}</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg">{f.icon}</div>
              <div><h3 className="text-sm font-medium text-light-3 mb-1">{f.title}</h3><p className="text-xs text-gray-3">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="divider mb-16" />
        <div className="flex items-end justify-between mb-10">
          <div><h2 className="text-2xl font-semibold text-light-3 mb-2">{t("home.categoriesTitle")}</h2><p className="text-sm text-gray-3">{t("home.categoriesDesc")}</p></div>
          <span className="text-xs text-gray-4">{categories.length} {t("common.categories")}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="glass-card p-6 flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center mb-3 text-white shadow-lg group-hover:scale-110 transition-transform">
                {categoryIcons[cat.slug] || <Package size={24} />}
              </div>
              <h3 className="text-sm font-medium text-light-3 mb-1">{cat.name}</h3>
              <p className="text-xs text-gray-3">{products.filter((p) => p.categoryId === cat.id).length} {t("common.products")}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="divider mb-16" />
        <div className="flex items-end justify-between mb-10">
          <div><h2 className="text-2xl font-semibold text-light-3 mb-2">{t("home.featuredTitle")}</h2><p className="text-sm text-gray-3">{t("home.featuredDesc")}</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {products.slice(0, 9).map((product) => {
            const stock = getAvailableStock(product.id);
            const category = categories.find((c) => c.id === product.categoryId);
            return (
              <div key={product.id} className="glass-card p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="badge badge-dark">{category?.name}</span>
                  {stock <= 5 && stock > 0 && <span className="badge badge-dark" style={{ color: "#eab308" }}>{t("common.lowStock")}</span>}
                  {stock === 0 && <span className="badge badge-dark" style={{ color: "#ef4444" }}>售罄</span>}
                </div>
                <h3 className="text-base font-medium text-light-3 mb-2">{product.name}</h3>
                <p className="text-xs text-gray-3 mb-4 line-clamp-2 flex-1">{product.description}</p>
                <div className="flex items-end justify-between mt-auto pt-4 border-t border-glass-border">
                  <div>
                    <span className="text-2xl font-bold text-light-3">{t("common.currency")}{product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-4 ml-2">{stock} {t("common.inStock")}</span>
                  </div>
                  <Link href={`/product/${product.id}`} className={`text-xs px-4 py-2 rounded-[10px] font-medium transition-all ${stock > 0 ? "btn-primary" : "bg-dark-3 text-gray-4 cursor-not-allowed"}`}>{t("common.buyNow")}</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Order Lookup */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="divider mb-16" />
        <div className="glass-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-light-3 mb-2">{t("home.alreadyPurchased")}</h2>
            <p className="text-sm text-gray-3">{t("home.alreadyPurchasedDesc")}</p>
          </div>
          <Link href="/order/query" className="btn-secondary text-sm flex items-center gap-2 shrink-0"><Search size={16} /> {t("home.trackOrder")}</Link>
        </div>
      </section>
    </div>
  );
}
