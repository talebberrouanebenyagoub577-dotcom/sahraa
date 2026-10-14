"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";
import toast from "react-hot-toast";
import {
  Banknote,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { UpsellModal, type UpsellProductData } from "@/components/checkout/UpsellModal";
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

export default function CheckoutPage() {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const router = useRouter();

  const { items, summary, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [city, setCity] = useState("الرياض");
  const [otherCity, setOtherCity] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [showUpsell, setShowUpsell] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reserved Stock Countdown Timer (10:00 minutes)
  const [minutesLeft, setMinutesLeft] = useState(9);
  const [secondsLeft, setSecondsLeft] = useState(55);

  useEffect(() => {
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
  }, []);

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error(isAr ? "سلتك فارغة!" : "Cart is empty!");
      return;
    }
    if (!validateForm()) return;

    // Show Upsell Offer Modal
    setShowUpsell(true);
  };

  const placeOrder = async (upsellProduct?: UpsellProductData) => {
    setLoading(true);
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
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.data?.id) {
        clearCart();
        setShowUpsell(false);
        router.replace(`/${locale}/order/success/${data.data.id}`);
      } else {
        toast.error(data.error || tc("error"));
        setLoading(false);
      }
    } catch {
      toast.error(tc("error"));
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Truck className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          {isAr ? "سلة مشترياتك فارغة" : "Your cart is empty"}
        </h1>
        <p className="mt-2 text-xs text-slate-600">
          {isAr
            ? "اختر المنتجات المفضلة لديك للاستفادة من باقات التوفير والشحن المجاني مع الدفع عند الاستلام."
            : "Choose products to take advantage of tier discounts and free COD shipping."}
        </p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          {isAr ? "تصفح المنتجات" : "Shop Now"}
          {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* Stock Timer Bar */}
      <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-2.5 px-4 text-center text-xs font-black text-amber-950 shadow-sm">
        <Clock className="h-4 w-4 animate-spin text-amber-700" style={{ animationDuration: "8s" }} />
        <span>
          {isAr
            ? `طلبك محجوز ومؤكد في المخزون لمدة: 0${minutesLeft}:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft} دقيقة`
            : `Order stock reserved for: 0${minutesLeft}:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft} min`}
        </span>
      </div>

      <div className="mb-8 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200 mb-2">
          <ShieldCheck className="h-4 w-4" />
          <span>{isAr ? "الدفع عند الاستلام 100% · فحص ومعاينة قبل الدفع" : "100% COD · Inspect before pay"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {isAr ? "إتمام الطلب السريع — الدفع عند الاستلام 🚚" : "Quick Checkout — Cash on Delivery 🚚"}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          {isAr
            ? "أدخل اسمك ورقم هاتفك وسنقوم بتوصيل طلبك مجاناً لباب بيتك والدفع عند الاستلام."
            : "Enter your name and phone, and we will deliver to your doorstep with free shipping."}
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Customer Form */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">
              {isAr ? "بيانات استلام الشحنة" : "Shipping Details"}
            </h2>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? "الاسم الكريم بالكامل *" : "Full Name *"}
              </label>
              <div className="relative">
                <User className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  placeholder={isAr ? "مثال: عبد الله السعيد" : "e.g. Abdullah Al-Saeed"}
                  className={`w-full rounded-xl border bg-slate-50/50 ps-11 pe-4 py-3.5 text-sm font-medium text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-300 focus:border-amber-500 focus:ring-amber-200"
                  }`}
                  required
                />
              </div>
              {formErrors.name && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? "رقم الجوال (واتساب للتوصيل والتأكيد) *" : "Mobile Phone (WhatsApp) *"}
              </label>
              <div className="relative flex rounded-xl border border-slate-300 bg-slate-50/50 shadow-sm overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200 focus-within:border-amber-500">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3.5 text-xs font-bold text-slate-700 border-e border-slate-200" dir="ltr">
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
                  className="w-full bg-transparent px-3 py-3.5 text-sm font-bold text-slate-900 focus:outline-none"
                  required
                />
              </div>
              {formErrors.phone && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.phone}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isAr ? "المدينة / المنطقة" : "City / Region"}
              </label>
              <div className="relative">
                <MapPin className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 ps-11 pe-8 py-3.5 text-sm font-medium text-slate-900 shadow-sm focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
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
                  placeholder={isAr ? "اكتب اسم مدينتك أو منطقتك بالتفصيل" : "Write your city name"}
                  className="mt-2.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                <Banknote className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery (COD)"}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {isAr
                    ? "ادفع نقداً أو عبر بطاقة مدى لمندوب التوصيل عند استلام وفحص الطرد أمام باب منزلك. لا يلزم إدخال أي بطاقة بنكية الآن."
                    : "Pay with cash or card upon receiving and inspecting your package at your doorstep."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & CTA */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">
              {isAr ? "ملخص الطلب" : "Order Summary"}
            </h2>

            {/* Volume Tier Incentive */}
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-bold text-slate-900">
                  {isAr ? summary.nextTierHintAr : summary.nextTierHintEn}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
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
                    <span className="text-xs font-black text-amber-600">
                      {formatPrice(item.price, "SAR", locale)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-lg px-2 py-1">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                <span>{formatPrice(summary.subtotal, "SAR", locale)}</span>
              </div>
              {summary.savings > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>{isAr ? "وفرت مع باقة التوفير" : "Bundle Savings"}</span>
                  <span>-{formatPrice(summary.savings, "SAR", locale)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? "الشحن والتوصيل" : "Delivery"}</span>
                <span className="font-bold text-emerald-600">
                  {isAr ? "مجاني لكافة المناطق" : "Free"}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                <span>{isAr ? "الإجمالي للدفع عند الاستلام" : "Total to Pay"}</span>
                <span className="text-2xl font-black text-amber-600">
                  {formatPrice(summary.total, "SAR", locale)}
                </span>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-4 px-6 text-center text-base font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
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

            {/* Trust Assurances */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[11px] font-semibold text-slate-500">
              <div className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 p-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isAr ? "فحص ومعاينة قبل الدفع" : "Inspect before pay"}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 p-2">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                <span>{isAr ? "استرجاع مجاني 14 يوم" : "14-Day Guarantee"}</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* The OTO Upsell Modal */}
      <UpsellModal
        isOpen={showUpsell}
        cartItems={items}
        isSubmitting={loading}
        onAccept={(upsellProduct) => {
          placeOrder(upsellProduct);
        }}
        onDecline={() => {
          placeOrder();
        }}
      />
    </div>
  );
}
