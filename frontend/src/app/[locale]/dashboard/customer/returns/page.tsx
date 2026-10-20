"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { returnStatusLabel } from "@/lib/returns/status";
import toast from "react-hot-toast";

type OrderItem = { id: string; name: string; nameAr?: string; quantity: number; price: number; sku: string };
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  deliveredAt?: string | null;
  createdAt: string;
  items: OrderItem[];
};
type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  refundAmount: number;
  goodsAmount: number;
  returnShippingCost: number;
  shippingDeducted: number;
  createdAt: string;
  order: { orderNumber: string };
};

export default function CustomerReturnsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiFetch("/api/orders?limit=50").then((r) => r.json()).then((d) => setOrders(d.data?.orders || []));
    apiFetch("/api/returns").then((r) => r.json()).then((d) => setReturns(d.data || []));
  };

  useEffect(() => {
    load();
  }, []);

  const eligible = useMemo(() => orders.filter((order) => order.status === "DELIVERED"), [orders]);
  const selected = eligible.find((order) => order.id === orderId);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await apiFetch("/api/returns/upload", { method: "POST", body });
      const data = await res.json();
      if (res.ok && data.data?.url) setImages((prev) => [...prev, data.data.url]);
      else toast.error(data.error || (isRtl ? "فشل الرفع" : "Upload failed"));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.entries(qty)
      .filter(([, quantity]) => quantity > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!orderId || !items.length) {
      toast.error(isRtl ? "اختر طلباً ومنتجاً" : "Choose an order and at least one item");
      return;
    }
    setSaving(true);
    const res = await apiFetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason, description, images, items }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || (isRtl ? "تعذر إنشاء الطلب" : "Could not create return"));
      return;
    }
    toast.success(isRtl ? "تم إرسال طلب الإرجاع" : "Return request submitted");
    setReason("");
    setDescription("");
    setImages([]);
    setQty({});
    load();
  };

  return (
    <DashboardLayout type="customer">
      <h1 className="mb-6 text-2xl font-bold">{isRtl ? "إرجاع منتج" : "Return a product"}</h1>

      <form onSubmit={submit} className="mb-10 space-y-4 rounded-2xl border bg-white p-6">
        <label className="block text-sm font-medium">
          {isRtl ? "الطلب" : "Order"}
          <select
            className="mt-1 w-full rounded-lg border p-2"
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setQty({});
            }}
            required
          >
            <option value="">{isRtl ? "اختر طلباً مسلّماً" : "Select a delivered order"}</option>
            {eligible.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber}
              </option>
            ))}
          </select>
        </label>

        {selected && (
          <div className="space-y-2">
            {selected.items.map((item) => (
              <label key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <span>
                  {isRtl ? item.nameAr || item.name : item.name} × {item.quantity}
                </span>
                <Input
                  type="number"
                  min={0}
                  max={item.quantity}
                  className="w-24"
                  value={qty[item.id] || 0}
                  onChange={(e) => setQty((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                />
              </label>
            ))}
          </div>
        )}

        <label className="block text-sm font-medium">
          {isRtl ? "سبب الإرجاع" : "Reason"}
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
        </label>
        <label className="block text-sm font-medium">
          {isRtl ? "وصف المشكلة (اختياري)" : "Description (optional)"}
          <textarea className="mt-1 w-full rounded-lg border p-3 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          {isRtl ? "صور توضيحية (اختياري)" : "Photos (optional)"}
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="mt-1 block" onChange={(e) => upload(e.target.files)} />
        </label>
        {images.length > 0 && (
          <p className="text-xs text-slate-500">{images.length} {isRtl ? "صورة" : "photos"}</p>
        )}
        <Button type="submit" disabled={saving}>{isRtl ? "إرسال طلب الإرجاع" : "Submit return"}</Button>
      </form>

      <h2 className="mb-4 text-xl font-bold">{isRtl ? "طلباتي" : "My requests"}</h2>
      {returns.length === 0 ? (
        <p className="text-slate-500">{isRtl ? "لا توجد طلبات إرجاع" : "No return requests"}</p>
      ) : (
        <div className="space-y-3">
          {returns.map((row) => (
            <Link key={row.id} href={`/${locale}/dashboard/customer/returns/${row.id}`} className="block rounded-2xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.order.orderNumber}</p>
                  <p className="text-sm text-slate-500">{row.reason}</p>
                </div>
                <Badge>{returnStatusLabel(row.status, isRtl)}</Badge>
              </div>
              <p className="mt-3 text-sm">
                {isRtl ? "المبلغ المقترح" : "Proposed refund"}: {formatPrice(row.refundAmount, "SAR", locale)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
