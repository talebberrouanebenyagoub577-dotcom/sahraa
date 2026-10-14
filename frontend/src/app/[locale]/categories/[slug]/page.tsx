"use client";

export const dynamic = "force-dynamic";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { ProductCard } from "@/components/products/ProductCard";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState<{ name: string; nameAr: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/products?category=${slug}&limit=24`).then((r) => r.json()),
      apiFetch("/api/categories").then((r) => r.json()),
    ]).then(([prodData, catData]) => {
      setProducts(prodData.data?.products || []);
      const cats = catData.data || [];
      const found = cats.find((c: { slug: string }) => c.slug === slug)
        || cats.flatMap((c: { children: { slug: string; name: string; nameAr: string }[] }) => c.children || []).find((c: { slug: string }) => c.slug === slug);
      setCategory(found || null);
    }).finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {category ? (locale === "ar" ? category.nameAr : category.name) : slug}
      </h1>
      {loading ? <p>Loading...</p> : products.length === 0 ? (
        <p className="text-slate-500">{locale === "ar" ? "لا توجد منتجات" : "No products found"}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p: { id: string }) => <ProductCard key={p.id} product={p as never} />)}
        </div>
      )}
    </div>
  );
}
