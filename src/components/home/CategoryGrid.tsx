"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
  _count?: { products: number };
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("home");
  const tc = useTranslations("common");

  const icons = ["📱", "👗", "🏠", "💄", "⚽", "🧸", "📚", "🍳"];

  return (
    <section className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-6 text-xl font-bold text-slate-900 md:text-2xl">
          {t("categories")}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/${locale}/categories/${cat.slug}`}
              className="group flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl group-hover:bg-amber-100">
                {cat.image ? (
                  <Image src={cat.image} alt={getLocalizedName(cat, locale)} width={48} height={48} className="rounded-xl object-cover" />
                ) : (
                  cat.icon || icons[i % icons.length]
                )}
              </div>
              <span className="text-center text-sm font-medium text-slate-700">
                {getLocalizedName(cat, locale)}
              </span>
              {cat._count && (
                <span className="mt-1 text-xs text-slate-400">
                  {cat._count.products} {tc("products").toLowerCase()}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
