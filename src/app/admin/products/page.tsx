"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductActive, getCategories, getAvailableStock, type Product } from "@/lib/mock-data";
import Modal from "@/components/ui/modal";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formStockType, setFormStockType] = useState<"one_time" | "repeatable">("one_time");

  const categories = getCategories();

  const loadData = () => {
    setProducts(getProducts());
  };

  useEffect(() => { loadData(); }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || p.categoryId === filterCategory;
    return matchSearch && matchCategory;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName(""); setFormDesc(""); setFormPrice(""); setFormCategory(categories[0]?.id || ""); setFormStockType("one_time");
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name); setFormDesc(product.description); setFormPrice(String(product.price));
    setFormCategory(product.categoryId); setFormStockType(product.stockType as "one_time" | "repeatable");
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPrice) return;
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, { name: formName, description: formDesc, price, categoryId: formCategory, stockType: formStockType });
    } else {
      createProduct({ name: formName, description: formDesc, price, categoryId: formCategory, stockType: formStockType, isActive: true, image: "" });
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setDeleteConfirm(null);
    loadData();
  };

  const handleToggle = (id: string) => {
    toggleProductActive(id);
    loadData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-light-3 mb-1">{t("admin.products.title")}</h1>
          <p className="text-sm text-gray-3">{products.length} {t("admin.products.total")}</p>
        </div>
        <button onClick={openAddModal} className="btn-primary text-sm flex items-center gap-2"><Plus size={16} /> {t("admin.products.addProduct")}</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input type="text" placeholder={t("admin.products.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="input-premium pl-10" />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-3" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-premium w-full sm:w-48 appearance-none cursor-pointer">
          <option value="all">{t("common.allCategories")}</option>
          {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.name")}</th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("admin.products.category")}</th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.price")}</th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("admin.products.stock")}</th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">{t("common.status")}</th>
                <th className="text-right text-xs font-medium text-gray-4 px-6 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const stock = getAvailableStock(product.id);
                return (
                  <tr key={product.id} className="border-b border-glass-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><div><p className="text-sm text-light-3">{product.name}</p><p className="text-xs text-gray-4 truncate max-w-[200px]">{product.description}</p></div></td>
                    <td className="px-6 py-4"><span className="badge badge-dark">{category?.name}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-light-3">${product.price.toFixed(2)}</span></td>
                    <td className="px-6 py-4"><span className={`text-sm ${stock <= 5 ? "text-warning" : "text-light-3"}`}>{stock}</span></td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggle(product.id)} className="text-gray-4 hover:text-light-3 cursor-pointer">
                        {product.isActive ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(product)} className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteConfirm(product.id)} className="p-1.5 rounded-lg text-gray-4 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? t("common.edit") : t("admin.products.addProduct")} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div><label className="block text-xs text-gray-4 mb-1.5">{t("common.name")}</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="input-premium" placeholder="Telegram 老号 (2022)" /></div>
          <div><label className="block text-xs text-gray-4 mb-1.5">{t("common.description")}</label><textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="input-premium h-20 resize-none" placeholder="账号描述..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("common.price")} ($)</label><input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="input-premium" placeholder="5.99" /></div>
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.products.category")}</label><select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="input-premium appearance-none cursor-pointer">{categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
          </div>
          <div><label className="block text-xs text-gray-4 mb-1.5">库存类型</label><select value={formStockType} onChange={(e) => setFormStockType(e.target.value as "one_time" | "repeatable")} className="input-premium appearance-none cursor-pointer"><option value="one_time">一次性发卡</option><option value="repeatable">可重复销售</option></select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-ghost text-sm">{t("common.cancel")}</button>
            <button onClick={handleSave} className="btn-primary text-sm">{t("common.save")}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="确认删除" maxWidth="max-w-sm">
        <p className="text-sm text-gray-3 mb-6">确定要删除这个商品吗？关联的卡密也将被删除，此操作不可撤销。</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-sm">{t("common.cancel")}</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-primary text-sm !bg-error hover:!bg-red-600">{t("common.delete")}</button>
        </div>
      </Modal>
    </div>
  );
}
