"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    apiFetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.data));
  }, [id]);

  const cancel = async () => {
    const res = await apiFetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", note: "Cancelled by customer" }),
    });
    if (res.ok) {
      toast.success(isRtl ? "تم الإلغاء" : "Cancelled");
      const d = await res.json();
      setOrder(d.data);
    }
  };

  if (!order) return <DashboardLayout type="customer"><p>Loading...</p></DashboardLayout>;

  const items = (order.items as Array<{ name: string; nameAr: string; quantity: number; total: number }>) || [];
  const history = (order.statusHistory as Array<{ status: string; createdAt: string }>) || [];

  return (
    <DashboardLayout type="customer">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{String(order.orderNumber)}</h1>
          <Badge className="mt-2">{String(order.status)}</Badge>
        </div>
        <div className="flex gap-2">
          {String(order.status) === "DELIVERED" && (
            <Link href={`/${locale}/dashboard/customer/returns`}>
              <Button variant="outline">{isRtl ? "إرجاع منتج" : "Return item"}</Button>
            </Link>
          )}
          {["PENDING", "CONFIRMED"].includes(String(order.status)) && (
            <Button variant="destructive" onClick={cancel}>{isRtl ? "إلغاء الطلب" : "Cancel Order"}</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h3 className="mb-4 font-bold">{isRtl ? "المنتجات" : "Items"}</h3>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between border-b py-2 text-sm">
              <span>{isRtl ? item.nameAr || item.name : item.name} x{item.quantity}</span>
              <span>{formatPrice(item.total, "SAR", locale)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between font-bold">
            <span>{isRtl ? "الإجمالي" : "Total"}</span>
            <span>{formatPrice(Number(order.total), "SAR", locale)}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h3 className="mb-4 font-bold">{isRtl ? "تتبع الطلب" : "Order Tracking"}</h3>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="font-medium">{h.status}</span>
                <span className="text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
