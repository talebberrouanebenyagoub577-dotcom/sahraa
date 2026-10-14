"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const locale = useLocale();
  const t = useTranslations("wishlist");
  const tc = useTranslations("common");
  const tCart = useTranslations("cart");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiFetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => setItems(d.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (productId: string) => {
    await apiFetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="p-8 text-center">{tc("loading")}</div>;

  if (!items.length) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-600">{t("empty")}</p>
        <p className="text-sm text-slate-500">{t("emptyDesc")}</p>
        <Link href={`/${locale}`}><Button>{tc("shopNow")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item: { id: string; productId: string; product: never }) => (
          <div key={item.id} className="relative">
            <ProductCard product={item.product} />
            <button onClick={() => remove(item.productId)} className="absolute top-2 start-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">
              {tCart("remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
