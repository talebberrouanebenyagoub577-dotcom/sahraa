"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { RETURN_STATUSES, returnStatusLabel } from "@/lib/returns/status";
import toast from "react-hot-toast";

type Row = {
  id: string;
  status: string;
  reason: string;
  goodsAmount: number;
  returnShippingCost: number;
  shippingBearer: string;
  refundAmount: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  order: { orderNumber: string };
  items: Array<{ name: string; nameAr?: string | null; quantity: number }>;
};

export default function AdminReturnsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    apiFetch(`/api/admin/returns${query ? `?${query}` : ""}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          toast.error(d.error || tc("error"));
          setRows([]);
          return;
        }
        setRows(Array.isArray(d.data) ? d.data : []);
      })
      .finally(() => setLoading(false));
  }, [q, status, from, to, tc]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <DashboardLayout type="admin">
      <h1 className="mb-6 text-2xl font-bold">{t("productReturns")}</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isRtl ? "رقم الطلب أو الاسم أو الهاتف" : "Order, name, phone"} />
        <select className="rounded-lg border p-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{isRtl ? "كل الحالات" : "All statuses"}</option>
          {RETURN_STATUSES.map((value) => (
            <option key={value} value={value}>{returnStatusLabel(value, isRtl)}</option>
          ))}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <DataTable
        loading={loading}
        data={rows as unknown as Record<string, unknown>[]}
        columns={[
          { key: "order", label: isRtl ? "الطلب" : "Order", render: (r) => String((r.order as Row["order"])?.orderNumber || "—") },
          { key: "customer", label: isRtl ? "الزبون" : "Customer", render: (r) => `${r.customerName || ""} ${r.customerPhone || ""}`.trim() },
          {
            key: "items",
            label: isRtl ? "المنتجات" : "Items",
            render: (r) => ((r.items as Row["items"]) || []).map((item) => `${isRtl ? item.nameAr || item.name : item.name}×${item.quantity}`).join("، "),
          },
          { key: "reason", label: isRtl ? "السبب" : "Reason", render: (r) => String(r.reason || "—") },
          { key: "goods", label: isRtl ? "قيمة المنتجات" : "Goods", render: (r) => formatPrice(Number(r.goodsAmount), "SAR", locale) },
          { key: "ship", label: isRtl ? "تكلفة الإرجاع" : "Return shipping", render: (r) => `${formatPrice(Number(r.returnShippingCost), "SAR", locale)} · ${r.shippingBearer === "STORE" ? (isRtl ? "المتجر" : "Store") : (isRtl ? "الزبون" : "Customer")}` },
          { key: "refund", label: isRtl ? "المبلغ المقترح" : "Proposed refund", render: (r) => formatPrice(Number(r.refundAmount), "SAR", locale) },
          { key: "status", label: isRtl ? "الحالة" : "Status", render: (r) => <Badge>{returnStatusLabel(String(r.status), isRtl)}</Badge> },
          { key: "date", label: isRtl ? "التاريخ" : "Date", render: (r) => new Date(String(r.createdAt)).toLocaleDateString(isRtl ? "ar-SA" : "en-US") },
          {
            key: "open",
            label: "",
            render: (r) => (
              <Link href={`/${locale}/dashboard/admin/returns/${String(r.id)}`} className="text-sm font-semibold text-amber-700">
                {isRtl ? "تفاصيل" : "Open"}
              </Link>
            ),
          },
        ]}
      />
    </DashboardLayout>
  );
}
