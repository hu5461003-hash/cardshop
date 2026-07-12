"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Send, RefreshCw, Check } from "lucide-react";
import { t } from "@/lib/i18n";
import { getOrders, updateOrderStatus, getProducts, type Order } from "@/lib/mock-data";
import Modal from "@/components/ui/modal";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = () => { setOrders(getOrders()); };
  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNo.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (id: string, status: Order["status"]) => {
    updateOrderStatus(id, status);
    showToast(`订单状态已更新为：${t(`status.${status}`)}`);
    loadData();
    if (viewOrder?.id === id) {
      const updated = getOrders().find((o) => o.id === id);
      if (updated) setViewOrder(updated);
    }
  };

  const statusBadge: Record<string, string> = { pending: "text-warning", paid: "text-info", delivered: "text-success", failed: "text-error", refunded: "text-gray-4" };

  return (
    <div className="animate-fade-in">
      {toast && (<div className="fixed top-4 right-4 z-50 glass-card px-4 py-3 flex items-center gap-2 animate-fade-in"><Check size={16} className="text-success" /><span className="text-sm text-light-3">{toast}</span></div>)}

      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-light-3 mb-1">{t("admin.orders.title")}</h1><p className="text-sm text-gray-3">{orders.length} {t("admin.orders.total")}</p></div>
        <button onClick={loadData} className="btn-secondary text-sm flex items-center gap-2"><RefreshCw size={14} /> {t("common.refresh")}</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1"><input type="text" placeholder={t("admin.orders.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="input-premium pl-10" /><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-3" /></div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-premium w-full sm:w-40 appearance-none cursor-pointer">
          <option value="all">{t("common.allStatus")}</option>
          <option value="pending">{t("status.pending")}</option><option value="paid">{t("status.paid")}</option><option value="delivered">{t("status.delivered")}</option><option value="failed">{t("status.failed")}</option><option value="refunded">{t("status.refunded")}</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-glass-border"><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("order.orderId")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.email")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("order.product")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.amount")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("order.payment")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.status")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.date")}</th><th className="text-right text-xs font-medium text-gray-4 px-6 py-3">{t("common.actions")}</th></tr></thead>
            <tbody>
              {filtered.map((order) => {
                const product = getProducts().find((p) => p.id === order.productId);
                return (
                  <tr key={order.id} className="border-b border-glass-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><span className="text-sm text-light-3 font-mono">{order.orderNo}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-4">{order.email}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-light-3">{product?.name}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-light-3">${order.totalAmount.toFixed(2)}</span></td>
                    <td className="px-6 py-4"><span className="text-xs text-gray-4">{order.paymentMethod.toUpperCase()}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs font-medium ${statusBadge[order.status] || "text-gray-4"}`}>{t(`status.${order.status}`)}</span></td>
                    <td className="px-6 py-4"><span className="text-xs text-gray-4">{new Date(order.createdAt).toLocaleDateString()}</span></td>
                    <td className="px-6 py-4"><div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewOrder(order)} className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer"><Eye size={14} /></button>
                      {order.status === "paid" && <button onClick={() => handleStatusChange(order.id, "delivered")} className="p-1.5 rounded-lg text-gray-4 hover:text-success hover:bg-success/10 transition-colors cursor-pointer"><Send size={14} /></button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={t("admin.orders.viewDetails")} maxWidth="max-w-lg">
        {viewOrder && (() => {
          const product = getProducts().find((p) => p.id === viewOrder.productId);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-4 mb-1">{t("order.orderId")}</p><p className="text-sm text-light-3 font-mono">{viewOrder.orderNo}</p></div>
                <div><p className="text-xs text-gray-4 mb-1">{t("common.status")}</p><span className={`text-sm font-medium ${statusBadge[viewOrder.status]}`}>{t(`status.${viewOrder.status}`)}</span></div>
                <div><p className="text-xs text-gray-4 mb-1">{t("common.email")}</p><p className="text-sm text-light-3">{viewOrder.email}</p></div>
                <div><p className="text-xs text-gray-4 mb-1">{t("order.product")}</p><p className="text-sm text-light-3">{product?.name}</p></div>
                <div><p className="text-xs text-gray-4 mb-1">{t("common.quantity")}</p><p className="text-sm text-light-3">{viewOrder.quantity}</p></div>
                <div><p className="text-xs text-gray-4 mb-1">{t("common.total")}</p><p className="text-sm text-light-3">${viewOrder.totalAmount.toFixed(2)}</p></div>
                <div><p className="text-xs text-gray-4 mb-1">{t("order.payment")}</p><p className="text-sm text-light-3">{viewOrder.paymentMethod.toUpperCase()}</p></div>
                <div><p className="text-xs text-gray-4 mb-1">{t("common.date")}</p><p className="text-sm text-light-3">{new Date(viewOrder.createdAt).toLocaleString()}</p></div>
              </div>
              {viewOrder.cardContent && (
                <div className="p-4 rounded-xl bg-dark-3/50 border border-glass-border">
                  <p className="text-xs text-gray-4 mb-2">{t("order.accountDetails")}</p>
                  <pre className="text-sm text-light-3 whitespace-pre-wrap font-mono">{viewOrder.cardContent}</pre>
                </div>
              )}
              <div><p className="text-xs text-gray-4 mb-2">更改状态</p>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "paid", "delivered", "failed", "refunded"] as const).map((s) => (
                    <button key={s} onClick={() => handleStatusChange(viewOrder.id, s)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${viewOrder.status === s ? "bg-white/[0.06] border-white/15 text-light-3" : "bg-dark-3 border-glass-border text-gray-4 hover:border-white/10"}`}>{t(`status.${s}`)}</button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
