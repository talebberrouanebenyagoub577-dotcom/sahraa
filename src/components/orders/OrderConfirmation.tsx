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
  WifiOff,
} from "lucide-react";
import type { CountryCode, Currency, OrderStatus } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice, getCountryName } from "@/lib/utils";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";

interface OrderItemData {
  id: string;
  name: string;
  nameAr: string | null;
  price: number;
  quantity: number;
  total: number;
  product: { slug: string; images: { url: string; alt: string | null }[] } | null;
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

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; order: OrderData }
  | { kind: "invalid" | "notFound" | "forbidden" | "unauthorized" | "error" | "network" };

const PROGRESS_STEPS: { label: "stepReceived" | "stepProcessing" | "stepShipped" | "stepDelivered"; statuses: OrderStatus[] }[] = [
  { label: "stepReceived", statuses: ["PENDING", "CONFIRMED"] },
  { label: "stepProcessing", statuses: ["PROCESSING"] },
  { label: "stepShipped", statuses: ["SHIPPED", "OUT_FOR_DELIVERY"] },
  { label: "stepDelivered", statuses: ["DELIVERED"] },
];

function maskPhone(phone: string): string {
  const compact = phone.replace(/\s+/g, "");
  if (compact.length < 7) return compact;
  return `${compact.slice(0, 3)}${"•".repeat(compact.length - 6)}${compact.slice(-3)}`;
}

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
  const t = useTranslations("orderSuccess");
  const [state, setState] = useState<LoadState>(
    isValidId ? { kind: "loading" } : { kind: "invalid" }
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isValidId) return;
    const controller = new AbortController();
    setState({ kind: "loading" });

    fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (res.ok) {
          const body = await res.json();
          setState({ kind: "ready", order: body.data as OrderData });
        } else if (res.status === 401) {
          setState({ kind: "unauthorized" });
        } else if (res.status === 403) {
          setState({ kind: "forbidden" });
        } else if (res.status === 404) {
          setState({ kind: "notFound" });
        } else {
          setState({ kind: "error" });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ kind: error instanceof TypeError ? "network" : "error" });
      });

    return () => controller.abort();
  }, [orderId, isValidId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (state.kind !== "ready") {
    const views = {
      invalid: { icon: FileQuestion, title: t("invalidTitle"), desc: t("invalidDesc") },
      notFound: { icon: FileQuestion, title: t("notFoundTitle"), desc: t("notFoundDesc") },
      forbidden: { icon: Lock, title: t("unauthorizedTitle"), desc: t("unauthorizedDesc") },
      unauthorized: { icon: Lock, title: t("signInTitle"), desc: t("signInDesc") },
      error: { icon: AlertTriangle, title: t("errorTitle"), desc: t("errorDesc") },
      network: { icon: WifiOff, title: t("networkTitle"), desc: t("networkDesc") },
    } as const;
    const view = views[state.kind];
    const Icon = view.icon;
    const canRetry = state.kind === "error" || state.kind === "network";

    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-8 w-8 text-slate-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{view.title}</h1>
        <p className="mt-2 text-slate-600">{view.desc}</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {canRetry && (
            <button type="button" onClick={retry} className={buttonVariants({ size: "lg" })}>
              {t("retry")}
            </button>
          )}
          {state.kind === "unauthorized" ? (
            <Link href={`/${locale}/auth/login`} className={buttonVariants({ size: "lg" })}>
              {t("signIn")}
            </Link>
          ) : (
            <Link
              href={`/${locale}/dashboard/customer/orders`}
              className={cn(buttonVariants({ size: "lg" }), canRetry && secondaryButton)}
            >
              {t("viewOrders")}
            </Link>
          )}
          <Link href={`/${locale}`} className={cn(buttonVariants({ size: "lg" }), secondaryButton)}>
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const { order } = state;
  const address = order.shippingAddress ?? {};
  const price = (amount: number) => formatPrice(amount, order.currency, locale);
  const currentStep = PROGRESS_STEPS.findIndex((step) => step.statuses.includes(order.status));
  const customerName = [address.firstName, address.lastName].filter(Boolean).join(" ");
  const addressLines = [
    address.street,
    [address.city, address.state, address.postalCode].filter(Boolean).join(locale === "ar" ? "، " : ", "),
    address.country ? getCountryName(address.country, locale) : undefined,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <section className="rounded-2xl border border-slate-100 bg-white px-6 py-8 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900 sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-slate-600">{t("subtitle")}</p>

        <dl className="mt-8 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">{t("orderNumber")}</dt>
            <dd className="mt-1 font-semibold text-slate-900" dir="ltr">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("orderDate")}</dt>
            <dd className="mt-1 font-semibold text-slate-900">{formatDate(order.createdAt, locale)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("status")}</dt>
            <dd className="mt-1">
              <Badge variant={currentStep === -1 ? "danger" : order.status === "DELIVERED" ? "success" : "warning"}>
                {t(`statuses.${order.status}`)}
              </Badge>
            </dd>
          </div>
        </dl>
      </section>

      {order.paymentMethod === "COD" && (
        <section className="mt-6 flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <Banknote className="h-6 w-6 text-amber-600" aria-hidden />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{t("codTitle")}</h2>
            <p className="mt-1 text-sm text-slate-700">{t("codDesc", { amount: price(order.total) })}</p>
          </div>
        </section>
      )}

      <Card title={t("tracking")}>
        {currentStep === -1 ? (
          <p className="text-sm text-slate-600">{t("stoppedNotice")}</p>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {PROGRESS_STEPS.map((step, index) => {
              const done = index <= currentStep;
              return (
                <li key={step.label} className="relative flex flex-col items-center text-center">
                  {index > 0 && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-4 h-0.5 w-full -translate-y-1/2 ltr:right-1/2 rtl:left-1/2",
                        done ? "bg-amber-500" : "bg-slate-200"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                      done ? "border-amber-500 bg-amber-500 text-white" : "border-slate-200 bg-white text-slate-400"
                    )}
                    aria-current={index === currentStep ? "step" : undefined}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                  </span>
                  <span className={cn("mt-2 text-xs sm:text-sm", done ? "font-medium text-slate-900" : "text-slate-500")}>
                    {t(step.label)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {order.estimatedDelivery && currentStep !== -1 && order.status !== "DELIVERED" && (
          <p className="mt-5 text-center text-sm text-slate-600">
            {t("estimatedDelivery")}:{" "}
            <span className="font-medium text-slate-900">{formatDate(order.estimatedDelivery, locale)}</span>
          </p>
        )}
      </Card>

      <Card title={t("items")}>
        <ul className="divide-y divide-slate-100">
          {order.items.map((item) => {
            const name = getLocalizedName(item, locale);
            const image = item.product?.images?.[0];
            const thumbnail = (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                {image ? (
                  <Image src={image.url} alt={image.alt || name} fill sizes="64px" className="object-cover" />
                ) : (
                  <Package className="absolute inset-0 m-auto h-6 w-6 text-slate-300" aria-hidden />
                )}
              </div>
            );
            return (
              <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                {item.product ? (
                  <Link href={`/${locale}/products/${item.product.slug}`}>{thumbnail}</Link>
                ) : (
                  thumbnail
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">{name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("quantity", { count: item.quantity })} · {t("unitPrice", { price: price(item.price) })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-900">{price(item.total)}</p>
              </li>
            );
          })}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <SummaryRow label={t("subtotal")} value={price(order.subtotal)} />
          <SummaryRow
            label={t("shipping")}
            value={order.shippingCost > 0 ? price(order.shippingCost) : t("free")}
          />
          {order.discount > 0 && (
            <SummaryRow label={t("discount")} value={`-${price(order.discount)}`} className="text-emerald-600" />
          )}
          {order.tax > 0 && <SummaryRow label={t("tax")} value={price(order.tax)} />}
          <SummaryRow
            label={t("total")}
            value={price(order.total)}
            className="border-t border-slate-100 pt-3 text-base font-bold text-slate-900"
          />
        </dl>
      </Card>

      <Card title={t("deliveryTo")}>
        <dl className="space-y-3 text-sm">
          {customerName && <DetailRow label={t("customerName")} value={customerName} />}
          {address.phone && (
            <DetailRow label={t("phone")} value={<span dir="ltr">{maskPhone(address.phone)}</span>} />
          )}
          {addressLines.length > 0 && (
            <DetailRow
              label={t("address")}
              value={
                <span className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span>
                    {addressLines.map((line) => (
                      <span key={line} className="block">{line}</span>
                    ))}
                  </span>
                </span>
              }
            />
          )}
        </dl>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`/${locale}/products`} className={cn(buttonVariants({ size: "lg" }), "sm:flex-1")}>
          {t("continueShopping")}
        </Link>
        <Link
          href={`/${locale}/dashboard/customer/orders`}
          className={cn(buttonVariants({ size: "lg" }), secondaryButton, "sm:flex-1")}
        >
          {t("viewOrders")}
        </Link>
        <Link href={`/${locale}`} className={cn(buttonVariants({ size: "lg" }), secondaryButton, "sm:flex-1")}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}

const secondaryButton =
  "border border-slate-200 bg-white text-slate-800 shadow-none hover:bg-slate-50";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-5 font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-4 text-slate-600", className)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
