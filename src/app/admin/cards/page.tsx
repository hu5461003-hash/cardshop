"use client";

import { useState, useEffect } from "react";
import { Upload, Download, Trash2, Key, Plus, FileText, X, Check } from "lucide-react";
import { t } from "@/lib/i18n";
import { getProducts, getCards, addCard, importCards, clearCards, deleteCard, getTotalStock, getAvailableStock, getCategories, type Product, type CardItem } from "@/lib/mock-data";
import Modal from "@/components/ui/modal";

export default function CardsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [showAddSingle, setShowAddSingle] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importProduct, setImportProduct] = useState("");
  const [singleContent, setSingleContent] = useState("");
  const [singleProduct, setSingleProduct] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [cardList, setCardList] = useState<CardItem[]>([]);

  const categories = getCategories();

  const loadData = () => {
    setProducts(getProducts());
    setCardList(selectedProduct === "all" ? getCards() : getCards(selectedProduct));
  };

  useEffect(() => { loadData(); }, [selectedProduct]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleImport = () => {
    if (!importProduct || !importText.trim()) return;
    const lines = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const count = importCards(importProduct, lines);
    showToast(`成功导入 ${count} 张卡密`);
    setImportText("");
    setShowImport(false);
    loadData();
  };

  const handleAddSingle = () => {
    if (!singleProduct || !singleContent.trim()) return;
    addCard(singleProduct, singleContent.trim());
    showToast("卡密添加成功");
    setSingleContent("");
    setShowAddSingle(false);
    loadData();
  };

  const handleClear = (productId: string) => {
    const count = clearCards(productId);
    showToast(`已清空 ${count} 张卡密`);
    setShowClearConfirm(null);
    loadData();
  };

  const handleDeleteCard = (id: string) => {
    deleteCard(id);
    loadData();
  };

  const handleExport = () => {
    const cards = selectedProduct === "all" ? getCards() : getCards(selectedProduct);
    const text = cards.map((c) => c.content).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cards_${selectedProduct}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${cards.length} 张卡密`);
  };

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-card px-4 py-3 flex items-center gap-2 animate-fade-in">
          <Check size={16} className="text-success" />
          <span className="text-sm text-light-3">{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-light-3 mb-1">{t("admin.cards.title")}</h1>
          <p className="text-sm text-gray-3">{getTotalStock()} {t("admin.cards.totalCards")} {products.length} {t("admin.cards.products")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-2"><Download size={14} /> {t("common.export")}</button>
          <button onClick={() => { setImportProduct(""); setImportText(""); setShowImport(true); }} className="btn-primary text-sm flex items-center gap-2"><Upload size={14} /> {t("common.import")}</button>
        </div>
      </div>

      {/* Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title={t("admin.cards.importTitle")} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div><label className="block text-xs text-gray-4 mb-1.5">{t("common.name")}</label><select value={importProduct} onChange={(e) => setImportProduct(e.target.value)} className="input-premium appearance-none cursor-pointer"><option value="">{t("admin.cards.selectProduct")}</option>{products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
          <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.cards.pasteText")}</label><textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={t("admin.cards.pastePlaceholder")} className="input-premium h-32 resize-none font-mono text-xs" /></div>
          <p className="text-xs text-gray-4">每行一个账号，格式：邮箱:密码 或 token</p>
          <div className="flex justify-end gap-3"><button onClick={() => setShowImport(false)} className="btn-ghost text-sm">{t("common.cancel")}</button><button onClick={handleImport} className="btn-primary text-sm">{t("common.import")} ({importText.split("\n").filter(Boolean).length} 条)</button></div>
        </div>
      </Modal>

      {/* Add Single Modal */}
      <Modal isOpen={showAddSingle} onClose={() => setShowAddSingle(false)} title="添加单条卡密" maxWidth="max-w-md">
        <div className="space-y-4">
          <div><label className="block text-xs text-gray-4 mb-1.5">{t("common.name")}</label><select value={singleProduct} onChange={(e) => setSingleProduct(e.target.value)} className="input-premium appearance-none cursor-pointer"><option value="">{t("admin.cards.selectProduct")}</option>{products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
          <div><label className="block text-xs text-gray-4 mb-1.5">卡密内容</label><textarea value={singleContent} onChange={(e) => setSingleContent(e.target.value)} placeholder="email:password" className="input-premium h-24 resize-none font-mono text-xs" /></div>
          <div className="flex justify-end gap-3"><button onClick={() => setShowAddSingle(false)} className="btn-ghost text-sm">{t("common.cancel")}</button><button onClick={handleAddSingle} className="btn-primary text-sm">{t("common.add")}</button></div>
        </div>
      </Modal>

      {/* Clear Confirm */}
      <Modal isOpen={!!showClearConfirm} onClose={() => setShowClearConfirm(null)} title="确认清空" maxWidth="max-w-sm">
        <p className="text-sm text-gray-3 mb-6">确定要清空该商品的所有卡密吗？此操作不可撤销。</p>
        <div className="flex justify-end gap-3"><button onClick={() => setShowClearConfirm(null)} className="btn-ghost text-sm">{t("common.cancel")}</button><button onClick={() => showClearConfirm && handleClear(showClearConfirm)} className="btn-primary text-sm !bg-error hover:!bg-red-600">确认清空</button></div>
      </Modal>

      {/* Stock Overview Table */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="p-4 border-b border-glass-border flex items-center gap-3">
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="input-premium w-48 text-sm py-2 appearance-none cursor-pointer">
            <option value="all">{t("common.all")}</option>
            {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <button onClick={() => { setSingleProduct(selectedProduct === "all" ? "" : selectedProduct); setShowAddSingle(true); }} className="btn-ghost text-xs flex items-center gap-1"><Plus size={14} /> {t("admin.cards.addSingle")}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-glass-border"><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.name")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("admin.products.category")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("admin.cards.totalStock")}</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.status")}</th><th className="text-right text-xs font-medium text-gray-4 px-6 py-3">{t("common.actions")}</th></tr></thead>
            <tbody>
              {products.filter((p) => selectedProduct === "all" || p.id === selectedProduct).map((product) => {
                const total = getTotalStock(product.id);
                const available = getAvailableStock(product.id);
                return (
                  <tr key={product.id} className="border-b border-glass-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Key size={16} className="text-gray-4" /><span className="text-sm text-light-3">{product.name}</span></div></td>
                    <td className="px-6 py-4"><span className="badge badge-dark">{categories.find((c) => c.id === product.categoryId)?.name}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-light-3">{available}/{total}</span></td>
                    <td className="px-6 py-4"><span className={`badge badge-dark ${available <= 5 ? "!text-warning" : ""}`}>{available <= 5 ? t("admin.cards.low") : available > 20 ? t("admin.cards.healthy") : t("admin.cards.normal")}</span></td>
                    <td className="px-6 py-4"><div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setSingleProduct(product.id); setShowAddSingle(true); }} className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer" title={t("admin.cards.addSingle")}><Plus size={14} /></button>
                      <button onClick={() => setShowClearConfirm(product.id)} className="p-1.5 rounded-lg text-gray-4 hover:text-error hover:bg-error/10 transition-colors cursor-pointer" title={t("admin.cards.clearAll")}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card List (when single product selected) */}
      {selectedProduct !== "all" && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-glass-border">
            <h3 className="text-sm font-medium text-light-3">卡密列表 ({cardList.length})</h3>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-dark-2"><tr className="border-b border-glass-border"><th className="text-left text-xs font-medium text-gray-4 px-6 py-2">#</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-2">内容</th><th className="text-left text-xs font-medium text-gray-4 px-6 py-2">{t("common.status")}</th><th className="text-right text-xs font-medium text-gray-4 px-6 py-2">{t("common.actions")}</th></tr></thead>
              <tbody>
                {cardList.slice(0, 50).map((card, i) => (
                  <tr key={card.id} className="border-b border-glass-border last:border-0 hover:bg-white/[0.02]">
                    <td className="px-6 py-2 text-xs text-gray-4">{i + 1}</td>
                    <td className="px-6 py-2 text-xs text-light-3 font-mono max-w-[300px] truncate">{card.content}</td>
                    <td className="px-6 py-2"><span className={`text-xs ${card.isSold ? "text-gray-4" : "text-success"}`}>{card.isSold ? "已售" : "可用"}</span></td>
                    <td className="px-6 py-2 text-right"><button onClick={() => handleDeleteCard(card.id)} className="p-1 rounded text-gray-4 hover:text-error cursor-pointer"><Trash2 size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
