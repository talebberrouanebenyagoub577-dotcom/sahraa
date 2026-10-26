"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/constants";
import { useEffect } from "react";

export function CartDrawer() {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const {
    items,
    count,
    summary,
    isCartOpen,
    closeCart,
    openCheckout,
    updateQuantity,
    removeItem,
  } = useCart();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isAr ? "ms-auto" : "me-auto"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 id="cart-drawer-title" className="text-lg font-bold text-slate-900">
                {isAr ? "سلة المشتريات" : "Shopping Cart"}
              </h2>
              <span className="text-xs text-slate-500">
                {isAr
                  ? `${count} ${count === 1 ? "منتج" : count === 2 ? "منتجان" : "منتجات"}`
                  : `${count} ${count === 1 ? "item" : "items"}`}
              </span>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Volume Tier Incentive Banner */}
        {count > 0 && (
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs font-semibold text-slate-800">
                {isAr ? summary.nextTierHintAr : summary.nextTierHintEn}
              </p>
            </div>
            {summary.savings > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {isAr
                    ? `وفرت ${formatPrice(summary.savings, "SAR", locale)} مع باقة التوفير!`
                    : `You saved ${formatPrice(summary.savings, "SAR", locale)} with bundle pricing!`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                {isAr ? "سلتك فارغة حالياً" : "Your cart is empty"}
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                {isAr
                  ? "تصفح منتجاتنا المميزة واستفد من عروض الباقات الحصرية مع الدفع عند الاستلام والشحن المجاني."
                  : "Explore our catalog and enjoy exclusive bundle savings with COD and free shipping."}
              </p>
              <button
                onClick={closeCart}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                {isAr ? "تصفح المنتجات الآن" : "Shop Now"}
                {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={`${item.productId}-${item.variantId || ""}`} className="flex gap-3.5 py-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    <Image
                      src={item.image}
                      alt={item.nameAr || item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h4 className="line-clamp-2 text-xs font-semibold text-slate-900 sm:text-sm">
                        {isAr ? item.nameAr || item.name : item.name}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-bold text-amber-600 text-sm">
                          {formatPrice(item.price, "SAR", locale)}
                        </span>
                      </div>
                    </div>

                    {/* Stepper & Delete */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer & CTA */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/70 p-5">
            {/* Trust Badges */}
            <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-1.5 rounded-lg bg-white p-2 border border-slate-100">
                <Truck className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isAr ? "شحن مجاني وسريع" : "Free Fast Shipping"}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-white p-2 border border-slate-100">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                <span>{isAr ? "معاينة قبل الدفع" : "Inspect Before Pay"}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-black">
                <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                <span>{formatPrice(summary.subtotal, "SAR", locale)}</span>
              </div>
              {summary.savings > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>{isAr ? "وفرت مع باقة التوفير" : "Bundle Savings"}</span>
                  <span>-{formatPrice(summary.savings, "SAR", locale)}</span>
                </div>
              )}
              <div className="flex justify-between text-black">
                <span>{isAr ? "الشحن والتوصيل" : "Delivery"}</span>
                <span className="font-semibold text-black">
                  {isAr ? "مجاني بالكامل" : "Free"}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-black">
                <span>{isAr ? "الإجمالي للدفع عند الاستلام" : "Total (COD)"}</span>
                <span className="text-xl text-black">
                  {formatPrice(summary.total, "SAR", locale)}
                </span>
              </div>
            </div>

            {/* High-Converting CTA Button */}
            <button
              type="button"
              onClick={openCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 px-4 text-center text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 active:scale-[0.99]"
            >
              <span>{isAr ? "إتمام الطلب السريع — الدفع عند الاستلام 🚚" : "Fast Checkout — Cash on Delivery 🚚"}</span>
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              {isAr
                ? "لا يلزم بطاقة بنكية · الدفع نقداً أو عبر مدى عند باب بيتك"
                : "No card needed · Pay cash or card at your doorstep"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
