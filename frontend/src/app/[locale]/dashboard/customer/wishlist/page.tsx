"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProductCard } from "@/components/products/ProductCard";

export default function CustomerWishlistPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiFetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => setItems(d.data || []));
  }, []);

  return (
    <DashboardLayout type="customer">
      <h1 className="mb-6 text-2xl font-bold">{isRtl ? "المفضلة" : "Wishlist"}</h1>
      {items.length === 0 ? (
        <p className="text-slate-500">{isRtl ? "لا توجد منتجات" : "No items"}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item: { id: string; product: never }) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
