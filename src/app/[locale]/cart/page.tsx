"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import toast from "react-hot-toast";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";

interface CartData {
  items: Array<{
    id: string;
    quantity: number;
    variant?: {
      name: string;
      nameAr?: string | null;
      price?: number | null;
      stock: number;
    } | null;
    product: {
      id: string;
      name: string;
      nameAr: string;
      slug: string;
      price: number;
      images?: { url: string }[];
    };
  }>;
  summary?: {
    subtotal: number;
    discount: number;
    bundleDiscount?: number;
    shippingCost?: number;
    remainingToBundle?: number;
    total: number;
  };
}

export default function CartPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const { refresh } = useCart();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");

  const loadCart = useCallback(async () => {
    const res = await fetch("/api/cart");
    if (res.ok) {
      const d = await res.json();
      setCart(d.data);
      await refresh();
    } else setCart(null);
    setLoading(false);
  }, [refresh]);

  useEffect(() => { loadCart(); }, [loadCart]);

  const removeItem = async (itemId: string) => {
    await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
    loadCart();
    toast.success(t("removed"));
  };

  const updateQty = async (itemId: string, quantity: number) => {
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity }),
    });
    loadCart();
  };

  const applyCoupon = async () => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode: coupon }),
    });
    const data = await res.json();
    if (res.ok) { loadCart(); toast.success(t("couponApplied")); }
    else toast.error(data.error);
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center">{tc("loading")}</div>;

  if (!cart?.items?.length) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <ShoppingBag className="h-16 w-16 text-slate-300" />
        <p className="text-lg text-slate-600">{t("empty")}</p>
        <Link href={`/${locale}`}><Button>{tc("shopNow")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">{t("title")}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const name = getLocalizedName(item.product, locale);
            const variantName = item.variant
              ? locale === "ar"
                ? item.variant.nameAr || item.variant.name
                : item.variant.name
              : null;
            const unitPrice = item.variant?.price ?? item.product.price;
            const image = item.product.images?.[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop";
            return (
              <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                  <Image src={image} alt={name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <Link href={`/${locale}/products/${item.product.slug}`} className="font-medium hover:text-amber-600">{name}</Link>
                  {variantName && <p className="text-xs text-slate-500">{variantName}</p>}
                  <p className="mt-1 text-lg font-bold">{formatPrice(unitPrice * item.quantity, "SAR", locale)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="rounded border p-1"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="rounded border p-1"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="h-5 w-5" /></button>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 h-fit">
          <h2 className="mb-4 text-lg font-bold">{t("orderSummary")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{t("subtotal")}</span><span>{formatPrice(cart.summary?.subtotal || 0, "SAR", locale)}</span></div>
            {(cart.summary?.discount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600"><span>{t("discount")}</span><span>-{formatPrice(cart.summary!.discount, "SAR", locale)}</span></div>
            )}
            <div className="flex justify-between">
              <span>{t("shipping")}</span>
              <span className="font-medium text-emerald-600">{t("free")}</span>
            </div>
            {(cart.summary?.remainingToBundle || 0) > 0 && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {t("bundleHint", { count: cart.summary!.remainingToBundle ?? 0 })}
              </p>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>{t("total")}</span><span>{formatPrice(cart.summary?.total || 0, "SAR", locale)}</span></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Input placeholder={t("coupon")} value={coupon} onChange={(e) => setCoupon(e.target.value)} className="flex-1" />
            <Button variant="outline" size="sm" onClick={applyCoupon}>{t("applyCoupon")}</Button>
          </div>
          <Link href={`/${locale}/checkout`} className="mt-6 block"><Button className="w-full">{t("checkout")}</Button></Link>
        </div>
      </div>
    </div>
  );
}
