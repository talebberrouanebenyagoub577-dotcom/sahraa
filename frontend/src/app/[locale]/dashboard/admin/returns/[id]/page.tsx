"use client";

import { apiFetch } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { returnStatusLabel } from "@/lib/returns/status";
import toast from "react-hot-toast";

type ReturnDetail = {
  id: string;
  status: string;
  reason: string;
  description?: string | null;
  adminReason?: string | null;
  internalNotes?: string | null;
  images: string[];
  goodsAmount: number;
  returnShippingCost: number;
  shippingBearer: string;
  deductShipping: boolean;
  shippingDeducted: number;
  refundAmount: number;
  customerName: string;
  customerPhone: string;
  refund?: { amount: number; reference: string; recordedAt: string; method: string } | null;
  items: Array<{ id: string; name: string; nameAr?: string | null; quantity: number; acceptedQuantity?: number | null; lineTotal: number }>;
  order: { orderNumber: string; paymentMethod: string; total: number; shippingCost: number };
};

export default function AdminReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [row, setRow] = useState<ReturnDetail | null>(null);
  const [adminReason, setAdminReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [returnShippingCost, setReturnShippingCost] = useState(0);
  const [shippingBearer, setShippingBearer] = useState("CUSTOMER");
  const [deductShipping, setDeductShipping] = useState(true);
  const [refundReference, setRefundReference] = useState("");

  const load = useCallback(() => {
    apiFetch(`/api/admin/returns/${id}`).then((r) => r.json()).then((d) => {
      if (d.data) {
        setRow(d.data);
        setAdminReason(d.data.adminReason || "");
        setInternalNotes(d.data.internalNotes || "");
        setReturnShippingCost(d.data.returnShippingCost || 0);
        setShippingBearer(d.data.shippingBearer || "CUSTOMER");
        setDeductShipping(Boolean(d.data.deductShipping));
      }
    });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: string) => {
    const res = await apiFetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        adminReason,
        internalNotes,
        returnShippingCost: Number(returnShippingCost),
        shippingBearer,
        deductShipping,
        refundReference: refundReference || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || (isRtl ? "تعذر التحديث" : "Update failed"));
      return;
    }
    toast.success(isRtl ? "تم التحديث" : "Updated");
    setRow(data.data);
  };

  if (!row) {
    return (
      <DashboardLayout type="admin">
        <p>{isRtl ? "جاري التحميل..." : "Loading..."}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{row.order.orderNumber}</h1>
          <p className="text-sm text-slate-600">{row.customerName} · {row.customerPhone || "—"}</p>
        </div>
        <Badge>{returnStatusLabel(row.status, isRtl)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <p className="text-sm">{isRtl ? "السبب" : "Reason"}: {row.reason}</p>
          {row.description && <p className="text-sm text-slate-600">{row.description}</p>}
          {row.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{isRtl ? item.nameAr || item.name : item.name} × {item.quantity}</span>
              <span>{formatPrice(item.lineTotal, "SAR", locale)}</span>
            </div>
          ))}
          {row.images?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {row.images.map((url) => (
                <Image key={url} src={mediaUrl(url)} alt="" width={88} height={88} className="h-22 w-22 rounded object-cover" unoptimized />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-6">
          <p className="flex justify-between text-sm"><span>{isRtl ? "قيمة المنتجات" : "Goods"}</span><span>{formatPrice(row.goodsAmount, "SAR", locale)}</span></p>
          <label className="block text-sm">
            {isRtl ? "تكلفة إرجاع التوصيل" : "Return shipping cost"}
            <Input type="number" min={0} step="0.01" value={returnShippingCost} onChange={(e) => setReturnShippingCost(Number(e.target.value))} />
          </label>
          <label className="block text-sm">
            {isRtl ? "من يتحمل التكلفة" : "Who pays return shipping"}
            <select className="mt-1 w-full rounded-lg border p-2" value={shippingBearer} onChange={(e) => setShippingBearer(e.target.value)}>
              <option value="CUSTOMER">{isRtl ? "الزبون" : "Customer"}</option>
              <option value="STORE">{isRtl ? "المتجر" : "Store"}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={deductShipping} onChange={(e) => setDeductShipping(e.target.checked)} />
            {isRtl ? "خصم تكلفة الإرجاع من المبلغ المسترد (حسب السياسة)" : "Deduct return shipping from refund (policy)"}
          </label>
          <p className="flex justify-between text-sm"><span>{isRtl ? "المخصوم" : "Deducted"}</span><span>{formatPrice(row.shippingDeducted, "SAR", locale)}</span></p>
          <p className="flex justify-between font-bold"><span>{isRtl ? "المبلغ النهائي" : "Final refund"}</span><span>{formatPrice(row.refundAmount, "SAR", locale)}</span></p>
          <p className="text-xs text-slate-500">{isRtl ? "إجمالي الطلب الأصلي لا يتغير. الاسترداد عملية منفصلة." : "Original order totals stay unchanged. Refund is a separate record."}</p>

          <label className="block text-sm">{isRtl ? "سبب إداري للزبون" : "Customer-facing reason"}
            <Input value={adminReason} onChange={(e) => setAdminReason(e.target.value)} />
          </label>
          <label className="block text-sm">{isRtl ? "ملاحظات داخلية" : "Internal notes"}
            <textarea className="mt-1 w-full rounded-lg border p-2 text-sm" rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </label>
          <label className="block text-sm">{isRtl ? "مرجع الاسترداد اليدوي" : "Manual refund reference"}
            <Input value={refundReference} onChange={(e) => setRefundReference(e.target.value)} placeholder={isRtl ? "رقم التحويل أو الإيصال" : "Transfer or receipt no."} />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => act("update_costs")}>{isRtl ? "حفظ التكاليف" : "Save costs"}</Button>
            <Button size="sm" onClick={() => act("approve")}>{isRtl ? "قبول" : "Approve"}</Button>
            <Button size="sm" variant="destructive" onClick={() => act("reject")}>{isRtl ? "رفض" : "Reject"}</Button>
            <Button size="sm" variant="outline" onClick={() => act("awaiting_receipt")}>{isRtl ? "بانتظار الاستلام" : "Awaiting receipt"}</Button>
            <Button size="sm" variant="outline" onClick={() => act("received")}>{isRtl ? "تم الاستلام" : "Received"}</Button>
            <Button size="sm" onClick={() => act("record_refund")}>{isRtl ? "تسجيل استرداد يدوي" : "Record manual refund"}</Button>
            <Button size="sm" variant="outline" onClick={() => act("complete")}>{isRtl ? "إكمال" : "Complete"}</Button>
          </div>
          {row.refund && (
            <p className="text-sm text-slate-600">{isRtl ? "مرجع مسجّل" : "Recorded"}: {row.refund.reference} · {formatPrice(row.refund.amount, "SAR", locale)}</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
