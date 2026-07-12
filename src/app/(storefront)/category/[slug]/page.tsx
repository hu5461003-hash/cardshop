"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { t } from "@/lib/i18n";
import { getCategories, getProducts, getAvailableStock } from "@/lib/mock-data";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const cat = getCategories().find((c) => c.slug === slug);
    setCategory(cat);
    if (cat) {
      setProducts(getProducts().filter((p) => p.categoryId === cat.id && p.isActive));
    }
  }, [slug]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-light-3 mb-4">{t("product.notFound")}</h1>
          <Link href="/" className="btn-secondary text-sm">{t("common.backToHome")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="border-b border-glass-border bg-dark-2/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-4 hover:text-light-3 transition-colors mb-6"><ArrowLeft size={16} /> {t("common.backToHome")}</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-light-3 mb-3">{category.name}</h1>
          <p className="text-gray-3">{category.description}</p>
          <p className="text-xs text-gray-4 mt-2">{products.length} {t("category.productsAvailable")}</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center min-h-[200px]"><Package size={32} className="text-gray-3 mb-4" /><p className="text-gray-3">{t("category.noProducts")}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {products.map((product) => {
              const stock = getAvailableStock(product.id);
              return (
                <div key={product.id} className="glass-card p-6 flex flex-col">
                  <h3 className="text-base font-medium text-light-3 mb-2">{product.name}</h3>
                  <p className="text-xs text-gray-3 mb-4 line-clamp-2 flex-1">{product.description}</p>
                  <div className="flex items-end justify-between mt-auto pt-4 border-t border-glass-border">
                    <div><span className="text-2xl font-bold text-light-3">{t("common.currency")}{product.price.toFixed(2)}</span><span className="text-xs text-gray-4 ml-2">{stock} {t("common.inStock")}</span></div>
                    <Link href={`/product/${product.id}`} className={`text-xs px-4 py-2 rounded-[10px] font-medium transition-all ${stock > 0 ? "btn-primary" : "bg-dark-3 text-gray-4 cursor-not-allowed"}`}>{t("common.buyNow")}</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
