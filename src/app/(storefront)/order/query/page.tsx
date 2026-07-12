"use client";

import { useState } from "react";
import { Search, Copy, Check } from "lucide-react";
import { t } from "@/lib/i18n";
import { getOrderByNoOrEmail, getProducts } from "@/lib/mock-data";

export default function OrderQueryPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const found = getOrderByNoOrEmail(query);
    setResult(found || null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const product = result ? getProducts().find((p) => p.id === result.productId) : null;
  const statusColors: Record<string, string> = { pending: "text-warning", paid: "text-info", delivered: "text-success", failed: "text-error" };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8"><h1 className="text-3xl font-bold text-light-3 mb-3">{t("order.title")}</h1><p className="text-sm text-gray-3">{t("order.desc")}</p></div>
        <div className="glass-card p-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative"><input type="text" placeholder={t("order.placeholder")} value={query} onChange={(e) => setQuery(e.target.value)} className="input-premium pl-10" /><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-3" /></div>
            <button type="submit" className="btn-primary w-full text-sm">{t("order.lookUp")}</button>
          </form>
          <p className="text-xs text-gray-4 text-center mt-4" dangerouslySetInnerHTML={{ __html: t("order.hint") }} />
        </div>
        {searched && result && (
          <div className="glass-card p-8 mt-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-medium text-light-3">{t("order.found")}</h2><span className={`text-sm font-medium ${statusColors[result.status] || "text-gray-4"}`}>{t(`status.${result.status}`)}</span></div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm"><span className="text-gray-4">{t("order.orderId")}</span><span className="text-light-3 font-mono">{result.orderNo}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-4">{t("order.product")}</span><span className="text-light-3">{product?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-4">{t("common.quantity")}</span><span className="text-light-3">{result.quantity}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-4">{t("common.total")}</span><span className="text-light-3 font-medium">{t("common.currency")}{result.totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-4">{t("order.payment")}</span><span className="text-light-3">{result.paymentMethod.toUpperCase()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-4">{t("common.date")}</span><span className="text-light-3">{new Date(result.createdAt).toLocaleDateString()}</span></div>
            </div>
            {result.cardContent && (
              <div className="p-4 rounded-xl bg-dark-3/50 border border-glass-border">
                <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-4">{t("order.accountDetails")}</span><button onClick={() => handleCopy(result.cardContent!)} className="flex items-center gap-1 text-xs text-gray-4 hover:text-light-3 transition-colors cursor-pointer">{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? t("order.copied") : t("order.copy")}</button></div>
                <pre className="text-sm text-light-3 whitespace-pre-wrap font-mono">{result.cardContent}</pre>
              </div>
            )}
          </div>
        )}
        {searched && !result && (<div className="glass-card p-8 mt-6 animate-fade-in text-center"><p className="text-gray-3">{t("order.notFound")}</p></div>)}
      </div>
    </div>
  );
}
