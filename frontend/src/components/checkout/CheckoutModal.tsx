"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  X,
  Lock,
  Clock,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  MapPin,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { apiFetch } from "@/lib/api";
import { getAttribution, getDeviceId, trackServerPurchase } from "@/lib/tracking/browser";
import { formatPrice } from "@/lib/utils";
import { UpsellModal, type UpsellProductData } from "./UpsellModal";
import toast from "react-hot-toast";
import type { Locale } from "@/lib/constants";

const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "القصيم / بريدة",
  "الأحساء / الهفوف",
  "الطائف",
  "تبوك",
  "أبها / خميس مشيط",
  "حائل",
  "نجران",
  "جازان",
  "ينبع",
  "الجبيل",
  "عرعر / سكاكا",
  "مدينة أخرى",
];

export function CheckoutModal() {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const router = useRouter();

  const {
    items,
    summary,
    isCheckoutOpen,
    closeCheckout,
    updateQuantity,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [city, setCity] = useState("الرياض");
  const [otherCity, setOtherCity] = useState("");

  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [showUpsell, setShowUpsell] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reserved Stock Countdown Timer (10:00 minutes)
  const [minutesLeft, setMinutesLeft] = useState(9);
  const [secondsLeft, setSecondsLeft] = useState(58);

  useEffect(() => {
    if (!isCheckoutOpen) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 0) {
          setMinutesLeft((m) => (m > 0 ? m - 1 : 0));
          return 59;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckoutOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isCheckoutOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  // Validation
  const validateForm = () => {
    const errors: { name?: string; phone?: string } = {};
    const trimmedName = customerName.trim();
    const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, "");

    if (trimmedName.length < 2) {
      errors.name = isAr
        ? "يرجى كتابة الاسم الكريم (حرفين على الأقل)"
        : "Please enter your name";
    }

    if (cleanPhone.length < 8 || !/^[0-9+]+$/.test(cleanPhone)) {
      errors.phone = isAr
        ? "يرجى كتابة رقم جوال صحيح (مثال: 05XXXXXXXX)"
        : "Please enter a valid phone number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Called when user clicks "تأكيد الطلب — الدفع عند الاستلام"
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error(isAr ? "سلة المشتريات فارغة!" : "Cart is empty!");
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Step 1 validation passed: Show the OTO Upsell Offer!
    setShowUpsell(true);
  };

  // Place final order (with or without upsell)
  const placeOrder = async (upsellProduct?: UpsellProductData) => {
    setSubmitting(true);
    const finalCity = city === "مدينة أخرى" && otherCity.trim() ? otherCity.trim() : city;
    const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, "");

    try {
      const payload = {
        shippingAddress: {
          firstName: customerName.trim(),
          phone: cleanPhone,
          city: finalCity,
          country: "SA",
        },
        paymentMethod: "COD",
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
        })),
        upsellProductId: upsellProduct?.id || undefined,
        attribution: getAttribution(),
        deviceId: getDeviceId() || undefined,
      };

      const res = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data?.data?.id) {
        trackServerPurchase(data.data.tracking?.purchase, {
          phone: cleanPhone,
          firstName: customerName.trim(),
          city: finalCity,
        });
        trackServerPurchase(data.data.tracking?.upsell, {
          phone: cleanPhone,
          firstName: customerName.trim(),
          city: finalCity,
        });
        clearCart();
        setShowUpsell(false);
        closeCheckout();
        router.push(`/${locale}/order/success/${data.data.id}`);
      } else {
        toast.error(data.error || (isAr ? "حدث خطأ أثناء تأكيد الطلب، يرجى المحاولة ثانية." : "Error placing order"));
        setSubmitting(false);
      }
    } catch {
      toast.error(isAr ? "تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت." : "Network error");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => {
            if (!submitting) closeCheckout();
          }}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <div
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl my-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
        >
          {/* Header & Stock Timer */}
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-5 py-3 text-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin text-slate-900" style={{ animationDuration: "8s" }} />
              <span className="text-xs font-black tracking-wide">
                {isAr
                  ? `تم حجز المنتجات لطلبك لمدة: 0${minutesLeft}:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}`
                  : `Reserved for your order: 0${minutesLeft}:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}`}
              </span>
            </div>
            <button
              onClick={() => {
                if (!submitting) closeCheckout();
              }}
              className="rounded-lg p-1 text-slate-800 hover:bg-black/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 sm:p-7 max-h-[85vh] overflow-y-auto">
            {/* Title & Trust */}
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                <span>{isAr ? "الدفع عند الاستلام 100% · فحص ومعاينة قبل الدفع" : "100% COD · Inspect before payment"}</span>
              </div>
              <h2 id="checkout-modal-title" className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
                {isAr ? "إتمام الطلب السريع — الدفع عند الاستلام 🚚" : "Quick Checkout — Cash on Delivery 🚚"}
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                {isAr
                  ? "أدخل اسمك ورقم هاتفك وسنقوم بتوصيل طلبك مجاناً لباب بيتك والدفع عند الاستلام."
                  : "Enter your name and phone, and we will deliver to your doorstep with free shipping."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleInitialSubmit} className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {isAr ? "بيانات استلام الشحنة" : "Shipping Details"}
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? "الاسم الكريم بالكامل *" : "Full Name *"}
                  </label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                      }}
                      placeholder={isAr ? "مثال: عبد الله السعيد" : "e.g. Abdullah Al-Saeed"}
                      className={`w-full rounded-xl border bg-white ps-10 pe-3 py-3 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${
                        formErrors.name
                          ? "border-red-400 focus:ring-red-300"
                          : "border-slate-300 focus:border-amber-500 focus:ring-amber-200"
                      }`}
                      required
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? "رقم الجوال (واتساب للتوصيل) *" : "Mobile Phone (WhatsApp) *"}
                  </label>
                  <div className="relative flex rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-amber-200 focus-within:border-amber-500">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3 text-xs font-bold text-slate-700 border-e border-slate-200" dir="ltr">
                      <span>🇸🇦</span>
                      <span>+966</span>
                    </div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                      }}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                      className="w-full bg-transparent px-3 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                      required
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* City Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? "المدينة / المنطقة" : "City / Region"}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white ps-10 pe-8 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    >
                      {SAUDI_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {city === "مدينة أخرى" && (
                    <input
                      type="text"
                      value={otherCity}
                      onChange={(e) => setOtherCity(e.target.value)}
                      placeholder={isAr ? "اكتب اسم مدينتك أو منطقتك" : "Write your city"}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Order Items & Tier Upsell Nudge */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {isAr ? "ملخص المنتجات" : "Order Items"}
                  </h3>
                  <span className="text-xs font-bold text-slate-700">
                    {items.length} {isAr ? "منتجات" : "items"}
                  </span>
                </div>

                {/* Incentive Volume Tier Box */}
                <div className="my-3 rounded-xl bg-amber-50/80 border border-amber-200/80 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs font-bold text-slate-900">
                      {isAr ? summary.nextTierHintAr : summary.nextTierHintEn}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId || ""}`} className="flex items-center gap-3 py-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        <Image
                          src={item.image}
                          alt={item.nameAr || item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-xs font-bold text-slate-900">
                          {isAr ? item.nameAr || item.name : item.name}
                        </h4>
                        <span className="text-xs font-extrabold text-amber-600">
                          {formatPrice(item.price, "SAR", locale)}
                        </span>
                      </div>
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="flex h-6 w-6 items-center justify-center text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="flex h-6 w-6 items-center justify-center text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="mt-3 border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span>{formatPrice(summary.subtotal, "SAR", locale)}</span>
                  </div>
                  {summary.savings > 0 && (
                    <div className="flex justify-between font-bold text-emerald-600">
                      <span>{isAr ? "خصم باقة التوفير" : "Bundle Savings"}</span>
                      <span>-{formatPrice(summary.savings, "SAR", locale)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? "الشحن والتوصيل" : "Delivery"}</span>
                    <span className="font-bold text-emerald-600">
                      {isAr ? "مجاني لكافة المناطق" : "Free"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900">
                    <span>{isAr ? "الإجمالي للدفع عند الاستلام" : "Total to Pay (COD)"}</span>
                    <span className="text-xl font-black text-amber-600">
                      {formatPrice(summary.total, "SAR", locale)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-4 px-6 text-center text-base font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{isAr ? "جاري المعالجة..." : "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5" />
                    <span>{isAr ? "تأكيد الطلب الآن — الدفع عند الاستلام 🚚" : "Confirm Order Now — Cash on Delivery 🚚"}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {isAr ? "دفع نقداً أو مدى" : "Cash or Mada"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  {isAr ? "معاينة قبل الدفع" : "Inspect before pay"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  {isAr ? "طلب آمن 100%" : "100% Secure"}
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* The OTO Upsell Modal triggered after validation */}
      <UpsellModal
        isOpen={showUpsell}
        cartItems={items}
        isSubmitting={submitting}
        onAccept={(upsellProduct) => {
          placeOrder(upsellProduct);
        }}
        onDecline={() => {
          placeOrder();
        }}
      />
    </>
  );
}
