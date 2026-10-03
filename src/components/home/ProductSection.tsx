"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard } from "@/components/products/ProductCard";
import { ChevronRight } from "lucide-react";
import { Currency } from "@prisma/client";

interface Product {
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
}

interface ProductSectionProps {
  title: string;
  products: Product[];
  section?: string;
  icon?: string;
}

export function ProductSection({ title, products, section, icon }: ProductSectionProps) {
  const locale = useLocale();
  const t = useTranslations("common");

  if (!products.length) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 md:text-2xl">
            {icon && <span>{icon}</span>}
            {title}
          </h2>
          {section && (
            <Link
              href={`/${locale}/products?section=${section}`}
              className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              {t("viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={Currency.SAR}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
