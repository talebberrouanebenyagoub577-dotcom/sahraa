"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Star,
  Loader2,
  X,
  PackagePlus,
  ShieldCheck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/context/CartContext";
import type { Locale } from "@/lib/constants";

export interface UpsellProductData {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  image: string;
  rating: number;
  reviewCount: number;
  originalPrice: number;
  upsellPrice: number;
  savings: number;
  pitchAr: string;
  pitchEn: string;
}

interface UpsellModalProps {
  isOpen: boolean;
  cartItems: CartItem[];
  onAccept: (product: UpsellProductData) => void;
  onDecline: () => void;
  isSubmitting?: boolean;
}

const TOTAL_COUNTDOWN_SECONDS = 15;

export function UpsellModal({
  isOpen,
  cartItems,
  onAccept,
  onDecline,
  isSubmitting = false,
}: UpsellModalProps) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [product, setProduct] = useState<UpsellProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_COUNTDOWN_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const declinedRef = useRef(false);

  // Fetch best complementary product when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(TOTAL_COUNTDOWN_SECONDS);
      declinedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    declinedRef.current = false;
    setSecondsLeft(TOTAL_COUNTDOWN_SECONDS);
    setLoading(true);

    const cartIds = cartItems.map((i) => i.productId).join(",");
    const cartSlugs = cartItems.map((i) => i.slug).join(",");

    apiFetch(`/api/upsell?cartIds=${encodeURIComponent(cartIds)}&cartSlugs=${encodeURIComponent(cartSlugs)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) {
          setProduct(data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, cartItems]);

  // Urgency Countdown Timer (15 seconds)
  useEffect(() => {
    if (!isOpen || loading || !product || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!declinedRef.current) {
            declinedRef.current = true;
            onDecline();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, loading, product, isSubmitting, onDecline]);

  if (!isOpen) return null;

  const progressPercent = (secondsLeft / TOTAL_COUNTDOWN_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isSubmitting) onDecline();
        }}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-amber-400/40 bg-white shadow-2xl ring-4 ring-amber-400/20 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Urgency Progress Bar */}
        <div className="h-2 w-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="bg-gradient-to-b from-amber-50/80 via-white to-white px-6 pt-5 pb-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 ring-4 ring-amber-500/10">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-red-100/90 px-3 py-1 text-xs font-extrabold text-red-700 ring-1 ring-red-300">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            <span>
              {isAr
                ? `ينتهي هذا العرض الحصري خلال: 00:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}`
                : `Exclusive offer expires in: 00:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}`}
            </span>
          </div>

          <h3 className="mt-2 text-lg sm:text-xl font-black text-slate-900">
            {isAr
              ? "🎉 انتظر! عرض لمرة واحدة فقط لطلبك الحالي"
              : "🎉 Wait! One-Time Exclusive Add-on for Your Order"}
          </h3>
          <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
            {isAr
              ? "أضف هذا المنتج المكمل إلى نفس شحنتك بـ 99 ر.س فقط (بدل 199 ر.س) مع شحن مجاني مدمج!"
              : "Add this complementary bestseller to your package for only 99 SAR (instead of 199 SAR)!"}
          </p>
        </div>

        {/* Content Body */}
        <div className="px-6 py-2">
          {loading || !product ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-xs font-medium text-slate-500">
                {isAr ? "جاري تجهيز العرض الأنسب لسلتك..." : "Selecting your best offer..."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
                  <Image
                    src={product.image}
                    alt={product.nameAr || product.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                  <div className="absolute top-1 start-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 shadow">
                    {isAr ? "خصم 100 ر.س" : "Save 100 SAR"}
                  </div>
                </div>

                {/* Product Meta */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                      <span className="ms-1 text-[11px] font-bold text-slate-700">5.0</span>
                      <span className="text-[10px] text-slate-500">
                        ({isAr ? "مشتري موثق" : "Verified"})
                      </span>
                    </div>

                    <h4 className="mt-1 text-sm font-bold text-slate-900 line-clamp-2">
                      {isAr ? product.nameAr || product.name : product.name}
                    </h4>

                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {isAr ? product.pitchAr : product.pitchEn}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="mt-2 flex items-baseline gap-2.5">
                    <span className="text-xl sm:text-2xl font-black text-emerald-700">
                      {formatPrice(product.upsellPrice, "SAR", locale)}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-semibold">
                      {formatPrice(product.originalPrice, "SAR", locale)}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      {isAr ? "وفر 50%" : "50% OFF"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping and COD Guarantee */}
              <div className="mt-3 flex items-center justify-between border-t border-amber-100 pt-2.5 text-[11px] font-medium text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isAr ? "شحن مجاني مدمج مع نفس الشحنة" : "Free Combined Shipping"}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  {isAr ? "الدفع عند الاستلام" : "Cash on Delivery"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-3 space-y-2.5">
          <button
            type="button"
            disabled={loading || isSubmitting || !product}
            onClick={() => product && onAccept(product)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 px-5 text-center text-sm sm:text-base font-extrabold text-white shadow-xl shadow-emerald-600/30 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{isAr ? "جاري إضافة العرض وتأكيد الطلب..." : "Confirming your order..."}</span>
              </>
            ) : (
              <>
                <PackagePlus className="h-5 w-5" />
                <span>
                  {isAr
                    ? "نعم! أضف هذا المنتج لطلبي بـ 99 ر.س فقط ✨"
                    : "Yes! Add this to my order for 99 SAR ✨"}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onDecline}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 transition-colors disabled:opacity-50"
          >
            {isAr
              ? "لا شكراً، سأكتفي بطلبي الأصلي وأفوّت هذا التوفير"
              : "No thanks, I will skip this offer and keep my original order"}
          </button>
        </div>
      </div>
    </div>
  );
}
