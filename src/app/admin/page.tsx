"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, ArrowUpRight, RefreshCw } from "lucide-react";
import { t } from "@/lib/i18n";
import { getDashboardStats, getOrders, getProducts } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalRevenue: 0, todayOrders: 0, activeProducts: 0, lowStockAlerts: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [time, setTime] = useState("");

  const loadData = () => {
    setStats(getDashboardStats());
    const orders = getOrders().slice(0, 5);
    setRecentOrders(orders);
    setTime(new Date().toLocaleTimeString());
  };

  useEffect(() => { loadData(); }, []);

  const statCards = [
    { label: "admin.dashboard.totalRevenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: <DollarSign size={20} />, change: "+12.5%", positive: true },
    { label: "admin.dashboard.todayOrders", value: String(stats.todayOrders), icon: <ShoppingCart size={20} />, change: "+3", positive: true },
    { label: "admin.dashboard.activeProducts", value: String(stats.activeProducts), icon: <Package size={20} />, change: "9 total", positive: true },
    { label: "admin.dashboard.lowStockAlerts", value: String(stats.lowStockAlerts), icon: <AlertTriangle size={20} />, change: "admin.dashboard.needsAttention", positive: false },
  ];

  const statusColor: Record<string, string> = { pending: "text-warning", paid: "text-info", delivered: "text-success", failed: "text-error" };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-light-3 mb-1">{t("admin.dashboard.title")}</h1>
          <p className="text-sm text-gray-3">{t("admin.dashboard.desc")}</p>
        </div>
        <button onClick={loadData} className="btn-secondary text-sm flex items-center gap-2"><RefreshCw size={14} /> {t("common.refresh")}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-white/[0.04] text-gray-4">{stat.icon}</div>
              <div className={`flex items-center gap-1 text-xs ${stat.positive ? "text-success" : "text-warning"}`}>
                {stat.positive ? <ArrowUpRight size={12} /> : <AlertTriangle size={12} />}
                {t(stat.change)}
              </div>
            </div>
            <p className="text-sm text-gray-3 mb-1">{t(stat.label)}</p>
            <p className="text-2xl font-bold text-light-3">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-light-3">{t("admin.dashboard.recentSales")}</h2>
            <TrendingUp size={16} className="text-gray-4" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {[1,2,3,4,5].map((i) => {
              const heights = [30, 80, 50, 65, 45];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-white/[0.08] rounded-t-lg transition-all hover:bg-white/[0.12]" style={{ height: `${heights[i-1]}%` }} />
                  <span className="text-xs text-gray-4">Day {i}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-base font-medium text-light-3 mb-4">{t("admin.dashboard.recentOrders")}</h2>
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const product = getProducts().find((p) => p.id === order.productId);
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-glass-border last:border-0">
                  <div>
                    <p className="text-sm text-light-3">{order.orderNo}</p>
                    <p className="text-xs text-gray-4">{product?.name}</p>
                  </div>
                  <span className={`text-xs font-medium ${statusColor[order.status] || "text-gray-4"}`}>{t(`status.${order.status}`)}</span>
                </div>
              );
            })}
            {recentOrders.length === 0 && <p className="text-sm text-gray-4 text-center py-4">暂无订单</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
