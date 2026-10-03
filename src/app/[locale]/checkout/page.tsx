"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/context/CartContext";
import toast from "react-hot-toast";
import { Banknote } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/constants";

type CartSummary = {
  subtotal: number;
  discount: number;
  remainingToBundle?: number;
  total: number;
};

export default function CheckoutPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const router = useRouter();
  const { refresh: refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const paymentMethod = "COD" as const;
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
  });
  const [summary, setSummary] = useState<CartSummary | null>(null);

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.summary) setSummary(data.data.summary);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    let placed = false;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            firstName: customer.name.trim(),
            phone: customer.phone.trim(),
          },
          paymentMethod,
        }),
      });
      const data = await res.json();
      const orderId: string | undefined = data.data?.id;
      if (res.ok && orderId) {
        placed = true;
        void refreshCart();
        router.replace(`/${locale}/order/success/${orderId}`);
      } else {
        toast.error(data.error || tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      // Stay locked after success so the form cannot be resubmitted while navigating away.
      if (!placed) {
        submittingRef.current = false;
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-4 font-bold">{t("customerDetails")}</h2>
            <Input
              placeholder={t("name")}
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              autoComplete="name"
              required
            />
            <Input
              className="mt-3"
              type="tel"
              placeholder={t("phone")}
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              autoComplete="tel"
              dir="ltr"
              required
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="mb-4 font-bold">{t("paymentMethod")}</h2>
            <div className="flex items-center gap-3 rounded-xl border border-amber-500 bg-amber-50 p-4">
              <Banknote className="h-5 w-5 text-amber-600" />
              <div>
                <span className="font-medium">{t("cod")}</span>
                <p className="text-sm text-slate-600">{t("codDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 h-fit">
          <h2 className="mb-4 font-bold">{t("orderSummary")}</h2>
          <p className="text-sm text-slate-600 mb-4">{t("orderTotalNote")}</p>
          {summary && (
            <div className="mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(summary.subtotal, "SAR", locale)}</span>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{t("discount")}</span>
                  <span>-{formatPrice(summary.discount, "SAR", locale)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t("shipping")}</span>
                <span className="font-medium text-emerald-600">{t("free")}</span>
              </div>
              {(summary.remainingToBundle || 0) > 0 && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  {t("bundleHint", { count: summary.remainingToBundle ?? 0 })}
                </p>
              )}
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>{t("total")}</span>
                <span>{formatPrice(summary.total, "SAR", locale)}</span>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading} aria-busy={loading}>
            {loading ? t("placingOrder") : t("placeOrder")}
          </Button>
        </div>
      </form>
    </div>
  );
}
