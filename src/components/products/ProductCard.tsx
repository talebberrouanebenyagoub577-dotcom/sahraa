"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./AddToCartButton";
import { WishlistButton } from "./WishlistButton";
import { Currency } from "@prisma/client";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";

interface ProductCardProps {
  product: {
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
  currency?: Currency;
}

export function ProductCard({ product, currency = Currency.SAR }: ProductCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const tp = useTranslations("product");
  const name = getLocalizedName(product, locale);
  const image = product.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const inStock = (product.inventory?.quantity ?? 1) > 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={`/${locale}/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-slate-50">
        <Image src={image} alt={name} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
        {discount > 0 && <Badge className="absolute top-2 start-2" variant="danger">-{discount}%</Badge>}
        {product.isFlashDeal && <Badge className="absolute top-2 end-12" variant="warning">⚡ {tp("flash")}</Badge>}
        <div className="absolute top-2 end-2 opacity-0 transition-opacity group-hover:opacity-100">
          <WishlistButton productId={product.id} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/${locale}/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-amber-600">{name}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs text-slate-600">{product.rating.toFixed(1)} ({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">{formatPrice(product.price, currency, locale)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-slate-400 line-through">{formatPrice(product.compareAtPrice, currency, locale)}</span>
          )}
        </div>
        <p className="mt-1 text-xs font-medium text-emerald-700">{t("freeShipping")} · {t("bundlePrice")}</p>
        {product.codAvailable && <Badge variant="success" className="mt-2 w-fit text-[10px]">{t("cod")}</Badge>}
        <AddToCartButton productId={product.id} size="sm" className="mt-3 w-full" disabled={!inStock} label={inStock ? t("addToCart") : tp("outOfStock")} />
      </div>
    </div>
  );
}
