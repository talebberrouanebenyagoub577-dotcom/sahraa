"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: { name: string; nameAr: string; quantity: number }[];
}

export default function CustomerOrdersPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.data?.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const statusVariant = (status: string) => {
    if (status === "DELIVERED") return "success";
    if (status === "CANCELLED") return "danger";
    if (status === "SHIPPED") return "warning";
    return "default";
  };

  return (
    <DashboardLayout type="customer">
      <h1 className="mb-6 text-2xl font-bold">
        {isRtl ? "طلباتي" : "My Orders"}
      </h1>

      {loading ? (
        <p>{isRtl ? "جاري التحميل..." : "Loading..."}</p>
      ) : orders.length === 0 ? (
        <p className="text-slate-500">{isRtl ? "لا توجد طلبات" : "No orders yet"}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-100 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/${locale}/dashboard/customer/orders/${order.id}`} className="font-semibold hover:text-amber-600">
                    {order.orderNumber}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString(
                      isRtl ? "ar-SA" : "en-US"
                    )}
                  </p>
                </div>
                <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {order.items.length} {isRtl ? "منتج" : "items"} · {order.paymentMethod}
                </p>
                <p className="font-bold">{formatPrice(order.total, "SAR", locale)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
