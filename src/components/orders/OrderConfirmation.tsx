"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  FileQuestion,
  Loader2,
  Lock,
  MapPin,
  Package,
  Phone,
  Truck,
  ShieldCheck,
  Copy,
  Sparkles,
  MessageCircle,
  Plus,
  WifiOff,
  Star,
  Clock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import type { CountryCode, Currency, OrderStatus } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice, getCountryName } from "@/lib/utils";
import { getLocalizedName } from "@/lib/i18n/display";
import toast from "react-hot-toast";
import type { Locale } from "@/lib/constants";

interface OrderItemData {
  id: string;
  productId?: string;
  name: string;
  nameAr: string | null;
  price: number;
  quantity: number;
  total: number;
  product: { id?: string; slug: string; images: { url: string; alt: string | null }[] } | null;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: CountryCode;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  currency: Currency;
  shippingAddress: ShippingAddress;
  estimatedDelivery: string | null;
  createdAt: string;
  items: OrderItemData[];
}

interface CrossSellProduct {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: { url: string }[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; order: OrderData }
  | { kind: "invalid" | "notFound" | "forbidden" | "unauthorized" | "error" | "network" };

const PROGRESS_STEPS = [
  {
    step: 1,
    titleAr: "تم استلام الطلب",
    titleEn: "Order Received",
    descAr: "تم استلام بياناتك بنجاح والبدء بتجهيز طلبك فوراً",
    descEn: "Order details received and preparing immediately",
    timeAr: "الآن",
    timeEn: "Now",
  },
  {
    step: 2,
    titleAr: "جاري التجهيز والتغليف",
    titleEn: "Packaging",
    descAr: "تجهيز الطرد وفحصه وتغليفه بعناية فائقة",
    descEn: "Inspecting and packaging your parcel carefully",
    timeAr: "خلال ساعتين",
    timeEn: "Within 2h",
  },
  {
    step: 3,
    titleAr: "تسليم الشحنة للمندوب",
    titleEn: "Handed to Courier",
    descAr: "انطلاق الشحنة مع شركة التوصيل السريع",
    descEn: "Dispatched with express delivery courier",
    timeAr: "غداً",
    timeEn: "Tomorrow",
  },
  {
    step: 4,
    titleAr: "التوصيل والدفع عند الباب",
    titleEn: "Doorstep Delivery & COD",
    descAr: "معاينة المنتج واستلامه والدفع نقداً أو بمدى",
    descEn: "Inspect product, pay cash or card at your doorstep",
    timeAr: "خلال 24-48 ساعة",
    timeEn: "24-48 hours",
  },
];

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { dateStyle: "long" }
  ).format(new Date(value));
}

export function OrderConfirmation({
  orderId,
  isValidId,
}: {
  orderId: string;
  isValidId: boolean;
}) {
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const t = useTranslations("orderSuccess");
  const tc = useTranslations("common");

  const [state, setState] = useState<LoadState>(
    isValidId ? { kind: "loading" } : { kind: "invalid" }
  );
  const [crossSells, setCrossSells] = useState<CrossSellProduct[]>([]);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load Order Details
  const fetchOrder = useCallback(() => {
    if (!isValidId) return;
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json();
          setState({ kind: "ready", order: body.data as OrderData });
        } else if (res.status === 404) {
          setState({ kind: "notFound" });
        } else {
          setState({ kind: "error" });
        }
      })
      .catch(() => {
        setState({ kind: "network" });
      });
  }, [orderId, isValidId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Load Cross-sells (available catalog products)
  useEffect(() => {
    fetch("/api/products?limit=6")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.products) {
          setCrossSells(data.data.products);
        }
      })
      .catch(() => {});
  }, []);

  const copyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    toast.success(isAr ? "تم نسخ رقم الطلب!" : "Order number copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  // Add Cross-Sell item to existing order
  const handleAddCrossSell = async (product: CrossSellProduct) => {
    if (addingItemId) return;
    setAddingItemId(product.id);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addCrossSellProductId: product.id }),
      });

      const body = await res.json();
      if (res.ok && body?.data) {
        setState({ kind: "ready", order: body.data as OrderData });
        toast.success(
          isAr
            ? `تمت إضافة (${product.nameAr || product.name}) لنفس الشحنة بنجاح!`
            : "Product added to your parcel successfully!"
        );
      } else {
        toast.error(body.error || tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setAddingItemId(null);
    }
  };

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="font-medium text-sm">{isAr ? "جاري تحميل تفاصيل طلبك..." : t("loading")}</p>
      </div>
    );
  }

  if (state.kind !== "ready") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{isAr ? "الطلب غير موجود" : "Order Not Found"}</h1>
        <p className="mt-2 text-xs text-slate-600">
          {isAr
            ? "تعذر العثور على تفاصيل هذا الطلب، يرجى التأكد من الرابط أو التواصل مع خدمة العملاء."
            : "Could not locate this order details. Please verify your link or contact support."}
        </p>
        <Link href={`/${locale}`} className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800">
          {isAr ? "العودة للرئيسية" : "Back to Home"}
        </Link>
      </div>
    );
  }

  const { order } = state;
  const address = order.shippingAddress ?? {};
  const customerName = [address.firstName, address.lastName].filter(Boolean).join(" ") || "عميل صحرا";
  const customerPhone = address.phone || "";
  const city = address.city || "المملكة العربية السعودية";

  // Filter cross-sells to exclude products already in order
  const orderedProductIds = new Set(
    order.items.map((i) => i.productId || i.product?.id || i.product?.slug)
  );
  const eligibleCrossSells = crossSells.filter(
    (p) => !orderedProductIds.has(p.id) && !orderedProductIds.has(p.slug)
  );

  // WhatsApp confirmation pre-filled URL
  const waPhone = "966500000000"; // Support phone
  const waMessage = encodeURIComponent(
    isAr
      ? `مرحباً متجر صحرا، أود تأكيد طلبي رقم ${order.orderNumber} باسم ${customerName}، بمبلغ ${order.total} ريال للدفع عند الاستلام. شكراً لكم!`
      : `Hello SAHRAA, I confirm my order ${order.orderNumber} under ${customerName}, total: ${order.total} SAR with Cash on Delivery.`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-6">
      {/* 1. Celebratory Success Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 via-white to-white p-6 sm:p-10 text-center shadow-sm">
        {/* Animated Celebration Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-100 animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3.5 py-1 text-xs font-black text-emerald-800">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isAr ? "تم استلام وتأكيد طلبك بنجاح!" : "Order Successfully Confirmed!"}</span>
        </div>

        <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
          {isAr
            ? `شكراً لثقتك بنا يا ${customerName.split(" ")[0]} 🎉`
            : `Thank You for Your Order, ${customerName.split(" ")[0]}! 🎉`}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed">
          {isAr
            ? "تم حجز منتجاتك وبدأ فريقنا فوراً بتجهيز وتغليف الشحنة لنسلمها لمندوب التوصيل السريع لباب بيتك."
            : "Your items are secured and our dispatch team has already started packaging your parcel for doorstep delivery."}
        </p>

        {/* Quick Order Info Pill Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-semibold">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <span className="block text-[11px] text-slate-500 mb-0.5">{isAr ? "رقم الطلب" : "Order #"}</span>
            <div className="flex items-center justify-center gap-1">
              <span className="font-extrabold text-slate-900" dir="ltr">{order.orderNumber}</span>
              <button
                type="button"
                onClick={() => copyOrderNumber(order.orderNumber)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                title="Copy"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <span className="block text-[11px] text-slate-500 mb-0.5">{isAr ? "طريقة الدفع" : "Payment"}</span>
            <span className="font-extrabold text-amber-700">{isAr ? "دفع عند الاستلام (COD)" : "Cash on Delivery"}</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <span className="block text-[11px] text-slate-500 mb-0.5">{isAr ? "الشحن والتوصيل" : "Shipping"}</span>
            <span className="font-extrabold text-emerald-700">{isAr ? "مجاني وسريع 🚚" : "Free Express"}</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center">
            <span className="block text-[11px] text-slate-500 mb-0.5">{isAr ? "المبلغ المطلوب" : "Total (COD)"}</span>
            <span className="text-base font-black text-amber-600">
              {formatPrice(order.total, order.currency, locale)}
            </span>
          </div>
        </div>
      </section>

      {/* 2. DELIVERY RATE BOOSTER #1: WhatsApp Immediate Confirmation CTA */}
      <section className="rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-500/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-start">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md">
              <MessageCircle className="h-8 w-8 fill-emerald-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-400/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide">
                <span>⚡ {isAr ? "تسريع الشحن الفوري" : "Fast-Track Priority Dispatch"}</span>
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-black">
                {isAr
                  ? "أكّد طلبك الآن عبر واتساب لتسريع الشحن خلال 24 ساعة!"
                  : "Confirm via WhatsApp for 24h Express Dispatch!"}
              </h2>
              <p className="mt-0.5 text-xs text-emerald-100 max-w-xl">
                {isAr
                  ? "اضغط لتأكيد طلبك فورا لخدمة العملاء بنقرة واحدة، لتجهيز طردك وشحنه فوراً دون انتظار اتصال هاتفي."
                  : "One-click WhatsApp confirmation moves your order to priority dispatch queue without phone call wait."}
              </p>
            </div>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-emerald-800 shadow-lg hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <MessageCircle className="h-5 w-5 fill-current" />
            <span>{isAr ? "تأكيد فوري عبر واتساب 📲" : "Confirm on WhatsApp 📲"}</span>
          </a>
        </div>
      </section>

      {/* 3. DELIVERY RATE BOOSTER #2: Important Courier Notice (Prevents unanswered courier calls) */}
      <section className="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-sm">
            <Phone className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-950">
              {isAr ? "📞 تنبيه هام لضمان استلام شحنتك دون أي تأخير:" : "Important Delivery Courier Notice:"}
            </h3>
            <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
              {isAr ? (
                <>
                  سيتصل بك مندوب التوصيل على هاتفك (
                  <span className="font-extrabold" dir="ltr">{customerPhone}</span>
                  ) قبل الوصول لتنسيق موقع الاستلام. نرجو إبقاء هاتفك متاحاً للرد على المندوب. يمكنك معاينة المنتج بالكامل أمام المندوب والدفع نقداً أو عبر بطاقة مدى.
                </>
              ) : (
                <>
                  The courier will call your phone ({customerPhone}) prior to arrival. Please keep your phone reachable. You can inspect the items before paying cash or card.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive Order Progress Timeline */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-6">
          {isAr ? "مراحل الشحن والتوصيل المتوقعة" : "Delivery Stages Timeline"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {PROGRESS_STEPS.map((step, idx) => (
            <div key={step.step} className="relative flex sm:flex-col items-start sm:items-center text-start sm:text-center gap-3 sm:gap-2">
              {/* Step Icon */}
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-sm ${
                  idx === 0
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                    : idx === 1
                    ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {idx === 0 ? <Check className="h-5 w-5 stroke-[3]" /> : step.step}
              </div>

              {/* Text */}
              <div>
                <span className="inline-block text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mb-1">
                  {isAr ? step.timeAr : step.timeEn}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  {isAr ? step.titleAr : step.titleEn}
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                  {isAr ? step.descAr : step.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Crystal Clear Order Items Breakdown */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">
            {isAr ? "تفاصيل المنتجات في طردك" : "Package Items"}
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {order.items.length} {isAr ? "منتجات" : "items"}
          </span>
        </div>

        <ul className="divide-y divide-slate-100">
          {order.items.map((item) => {
            const isSpecialUpsell = item.price === 99 || item.name.includes("عرض خاص") || (item.nameAr && item.nameAr.includes("عرض خاص"));
            const image = item.product?.images?.[0]?.url || "/placeholder.png";
            return (
              <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    <Image
                      src={image}
                      alt={item.nameAr || item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {isAr ? item.nameAr || item.name : item.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {isAr ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                      </span>
                      {isSpecialUpsell && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          {isAr ? "⭐ عرض Upsell بـ 99 ر.س" : "⭐ Special 99 SAR Add-on"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    {formatPrice(item.total, order.currency, locale)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Financial Summary */}
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
            <span>{formatPrice(order.subtotal, order.currency, locale)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between font-bold text-emerald-600">
              <span>{isAr ? "وفرت مع باقة التوفير" : "Bundle Savings"}</span>
              <span>-{formatPrice(order.discount, order.currency, locale)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>{isAr ? "رسوم الشحن والتوصيل" : "Shipping Cost"}</span>
            <span className="font-bold text-emerald-600">{isAr ? "مجاني (0 ر.س)" : "Free"}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
            <span>{isAr ? "المبلغ المطلوب عند الاستلام" : "Total COD Payable"}</span>
            <span className="text-2xl font-black text-amber-600">
              {formatPrice(order.total, order.currency, locale)}
            </span>
          </div>
        </div>

        {/* Delivery Address Details */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{isAr ? "عنوان التوصيل المعتمد:" : "Delivery Address:"}</span>
          </div>
          <p>{customerName} — {customerPhone}</p>
          <p className="text-slate-500 mt-0.5">{city}</p>
        </div>
      </section>

      {/* 6. The SAHRAA Golden Guarantee (Boosts Trust & Prevents Buyer Remorse) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 text-center sm:text-start">
          {isAr ? "🛡️ ضمان صحرا الذهبي المعتمد" : "SAHRAA Golden Guarantee"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-start">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-slate-900">
              {isAr ? "معاينة المنتج قبل الدفع" : "Inspect Before Paying"}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              {isAr
                ? "يحق لك فحص ومعاينة محتويات الطرد أمام المندوب والتأكد من مطابقتها قبل سداد المبلغ."
                : "Open and inspect your parcel with the courier before handing over payment."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-slate-900">
              {isAr ? "منتجات أصلية 100%" : "100% Genuine Products"}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              {isAr
                ? "جميع المنتجات مفحوصة ومطابقة تماماً للصور والمواصفات المعروضة في المتجر."
                : "All items are certified, original, and strictly match the store media."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-slate-900">
              {isAr ? "استبدال مجاني خلال 14 يوماً" : "14-Day Free Exchange"}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              {isAr
                ? "خدمة عملاء على مدار الساعة لمساعدتك واستبدال أي منتج فوراً في حال وجود أي ملاحظة."
                : "24/7 support to assist with fast replacement or assistance if needed."}
            </p>
          </div>
        </div>
      </section>

      {/* 7. Thank You Page Cross-Sells (Add to existing parcel at original price: 199 SAR) */}
      {eligibleCrossSells.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/50 to-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-5 text-center sm:text-start">
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-[11px] font-black text-amber-800">
                <Truck className="h-3.5 w-3.5" />
                <span>{isAr ? "شحن مجاني مدمج" : "Free Combined Shipping"}</span>
              </div>
              <h2 className="mt-1 text-lg font-black text-slate-900">
                {isAr
                  ? "هل ترغب في إضافة منتج آخر لنفس الشحنة قبل إغلاق الطرد؟"
                  : "Add another product to this shipment before dispatch?"}
              </h2>
              <p className="text-xs text-slate-600">
                {isAr
                  ? "أضف أي منتج بالسعر الأصلي (199 ر.س) وسيتم دمجه داخل نفس الطرد دون أي مصاريف شحن إضافية."
                  : "Add at the standard price (199 SAR) with zero extra delivery fee."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {eligibleCrossSells.slice(0, 3).map((prod) => {
              const image = prod.images?.[0]?.url || "/placeholder.png";
              const isAdding = addingItemId === prod.id;
              return (
                <div
                  key={prod.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-amber-300 transition-all"
                >
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 mb-3">
                      <Image
                        src={image}
                        alt={prod.nameAr || prod.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-bold text-slate-700">
                        {prod.rating ? prod.rating.toFixed(1) : "4.9"}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-900">
                      {isAr ? prod.nameAr || prod.name : prod.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">
                      {formatPrice(199, "SAR", locale)}
                    </span>

                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddCrossSell(prod)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{isAr ? "جاري الإضافة..." : "Adding..."}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>{isAr ? "أضف لنفس الشحنة" : "Add to Order"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Back to Home Button */}
      <div className="pt-4 text-center">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-colors"
        >
          {isAr ? "تصفح باقي منتجات المتجر" : "Explore More Products"}
          {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    </div>
  );
}
