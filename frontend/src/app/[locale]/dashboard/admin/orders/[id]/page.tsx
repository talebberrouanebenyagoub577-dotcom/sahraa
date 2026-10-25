"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod?: string;
  total: number;
  subtotal?: number;
  createdAt: string;
  notes?: string | null;
  customer?: { fullName: string; phone: string; city: string };
  shippingAddress?: { street?: string; city?: string; firstName?: string; lastName?: string; phone?: string };
  items?: Array<{
    id: string;
    name: string;
    nameAr?: string | null;
    quantity: number;
    price: number;
    sku?: string;
    size?: string | null;
    color?: string | null;
  }>;
}

export default function AdminOrderDetailPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/api/orders/${params.id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          toast.error(body.error || t("loadFailed"));
          setOrder(null);
          return;
        }
        setOrder(body.data as OrderDetail);
      })
      .finally(() => setLoading(false));
  }, [params.id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (status: string) => {
    if (!order) return;
    const res = await apiFetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: `Status updated to ${status}` }),
    });
    if (res.ok) {
      toast.success(t("updated"));
      load();
    }
  };

  return (
    <DashboardLayout type="admin">
      <Link href={`/${locale}/dashboard/admin/orders`} className="mb-4 inline-block text-sm text-amber-400">
        ← {t("orderManagement")}
      </Link>
      {loading || !order ? (
        <p className="text-slate-400">{loading ? t("loading") : t("noOrders")}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{t("orderDetails")}</h1>
              <p className="mt-1 text-slate-300">
                {order.orderNumber} · {new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-GB")}
              </p>
            </div>
            <Badge>{order.status}</Badge>
          </div>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-100">
            <h2 className="mb-3 text-lg font-semibold">{t("colCustomer")}</h2>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400">{t("customerFullName")}</dt>
                <dd>{order.customer?.fullName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">{t("colPhone")}</dt>
                <dd dir="ltr">{order.customer?.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">{t("colCity")}</dt>
                <dd>{order.customer?.city || order.shippingAddress?.city || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">{t("colPayment")}</dt>
                <dd>{order.paymentMethod || "COD"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-100">
            <h2 className="mb-3 text-lg font-semibold">{t("colProducts")}</h2>
            <ul className="space-y-3">
              {(order.items || []).map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{locale === "ar" ? item.nameAr || item.name : item.name}</p>
                    <p className="text-sm text-slate-400">
                      {t("colQty")}: {item.quantity}
                      {item.size ? ` · ${t("colSize")}: ${item.size}` : ""}
                      {item.color ? ` · ${t("colColor")}: ${item.color}` : ""}
                    </p>
                  </div>
                  <p>{formatPrice(item.price * item.quantity, "SAR", locale)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-end text-lg font-bold">
              {t("colTotal")}: {formatPrice(order.total, "SAR", locale)}
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            {["CONFIRMED", "SHIPPED", "DELIVERED"].map((status) => (
              <Button key={status} variant="outline" onClick={() => updateStatus(status)}>
                {status}
              </Button>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
