"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export function SearchResults() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`)
      .then((r) => r.json())
      .then((d) => setResults(d.data?.results || []))
      .finally(() => setLoading(false));
  }, [query, locale]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {isRtl ? `نتائج البحث: "${query}"` : `Search results: "${query}"`}
      </h1>
      {loading ? <p>{isRtl ? "جاري البحث..." : "Searching..."}</p> : results.length === 0 ? (
        <p className="text-slate-500">{isRtl ? "لا توجد نتائج" : "No results found"}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((item) => (
            <Link
              key={String(item.id)}
              href={`/${locale}/products/${item.slug}`}
              className="flex gap-4 rounded-xl border border-slate-100 bg-white p-4 hover:shadow-md"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                {item.image ? <Image src={String(item.image)} alt="" fill className="object-cover" /> : null}
              </div>
              <div>
                <p className="font-medium line-clamp-2">{isRtl ? String(item.nameAr) : String(item.name)}</p>
                <p className="text-sm text-slate-500">{String(item.category)}</p>
                <p className="mt-1 font-bold">{formatPrice(Number(item.price), "SAR", locale)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
