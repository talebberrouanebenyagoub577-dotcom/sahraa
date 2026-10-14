"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/products/ProductCard";

type RecentProduct = {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  rating: number;
  reviewCount: number;
  codAvailable: boolean;
  isFlashDeal?: boolean;
  images?: { url: string }[];
  inventory?: { quantity: number } | null;
};

export function RecentlyViewedSection({
  productId,
}: {
  productId: string;
}) {
  const t = useTranslations("product");
  const [products, setProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const trackAndLoad = async () => {
      try {
        const tracked = await apiFetch("/api/recently-viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
          signal: controller.signal,
        });
        if (tracked.status === 401) return;

        const params = new URLSearchParams({
          excludeProductId: productId,
          limit: "5",
        });
        const response = await apiFetch(`/api/recently-viewed?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const json = await response.json();
        setProducts(json.data || []);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    trackAndLoad();
    return () => controller.abort();
  }, [productId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">{t("recentlyViewed")}</h2>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
