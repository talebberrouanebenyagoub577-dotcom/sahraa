"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard } from "@/components/products/ProductCard";

const SECTION_KEYS = ["featured", "trending", "bestSellers", "flashDeals", "newArrivals"] as const;

export function ProductsList() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const th = useTranslations("home");
  const tc = useTranslations("common");
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "24" });
    if (section) params.set("section", section);
    apiFetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.data?.products || []))
      .finally(() => setLoading(false));
  }, [section]);

  const sectionTitle = section && SECTION_KEYS.includes(section as typeof SECTION_KEYS[number])
    ? th(section as typeof SECTION_KEYS[number])
    : tc("allProducts");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{section ? sectionTitle : tc("allProducts")}</h1>
      {loading ? (
        <p>{tc("loading")}</p>
      ) : products.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-600">
          {tc("noProductsYet")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={String(p.id)} product={p as never} />
          ))}
        </div>
      )}
    </div>
  );
}
