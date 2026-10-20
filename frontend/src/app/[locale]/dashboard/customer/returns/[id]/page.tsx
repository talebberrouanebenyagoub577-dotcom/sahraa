"use client";

import { apiFetch } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { returnStatusLabel } from "@/lib/returns/status";

type ReturnDetail = {
  status: string;
  reason: string;
  description?: string | null;
  adminReason?: string | null;
  images: string[];
  goodsAmount: number;
  returnShippingCost: number;
  shippingBearer: string;
  shippingDeducted: number;
  refundAmount: number;
  createdAt: string;
  refund?: { amount: number; reference: string; recordedAt: string; method: string } | null;
  items: Array<{ name: string; nameAr?: string | null; quantity: number; acceptedQuantity?: number | null; lineTotal: number }>;
  order: { orderNumber: string; paymentMethod: string };
};

export default function CustomerReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [row, setRow] = useState<ReturnDetail | null>(null);

  useEffect(() => {
    apiFetch(`/api/returns/${id}`).then((r) => r.json()).then((d) => setRow(d.data));
  }, [id]);

  if (!row) {
    return (
      <DashboardLayout type="customer">
        <p>{isRtl ? "جاري التحميل..." : "Loading..."}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="customer">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{row.order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{new Date(row.createdAt).toLocaleString(isRtl ? "ar-SA" : "en-US")}</p>
        </div>
        <Badge>{returnStatusLabel(row.status, isRtl)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold">{isRtl ? "المنتجات" : "Items"}</h2>
          {row.items.map((item, index) => (
            <div key={index} className="flex justify-between border-b py-2 text-sm">
              <span>{isRtl ? item.nameAr || item.name : item.name} × {item.acceptedQuantity ?? item.quantity}</span>
              <span>{formatPrice(item.lineTotal, "SAR", locale)}</span>
            </div>
          ))}
          <p className="mt-4 text-sm">{isRtl ? "السبب" : "Reason"}: {row.reason}</p>
          {row.description && <p className="mt-2 text-sm text-slate-600">{row.description}</p>}
          {row.adminReason && <p className="mt-2 text-sm text-red-600">{row.adminReason}</p>}
          {row.images?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {row.images.map((url) => (
                <Image key={url} src={mediaUrl(url)} alt="" width={80} height={80} className="h-20 w-20 rounded object-cover" unoptimized />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-3 font-bold">{isRtl ? "حساب الاسترداد" : "Refund breakdown"}</h2>
          <p className="flex justify-between text-sm"><span>{isRtl ? "قيمة المنتجات" : "Goods"}</span><span>{formatPrice(row.goodsAmount, "SAR", locale)}</span></p>
          <p className="flex justify-between text-sm"><span>{isRtl ? "تكلفة إرجاع التوصيل" : "Return shipping"}</span><span>{formatPrice(row.returnShippingCost, "SAR", locale)}</span></p>
          <p className="flex justify-between text-sm"><span>{isRtl ? "الجهة المتحملة" : "Borne by"}</span><span>{row.shippingBearer === "STORE" ? (isRtl ? "المتجر" : "Store") : (isRtl ? "الزبون" : "Customer")}</span></p>
          <p className="flex justify-between text-sm"><span>{isRtl ? "المخصوم من الاسترداد" : "Deducted"}</span><span>{formatPrice(row.shippingDeducted, "SAR", locale)}</span></p>
          <p className="mt-3 flex justify-between font-bold"><span>{isRtl ? "المبلغ المسترد" : "Refund"}</span><span>{formatPrice(row.refundAmount, "SAR", locale)}</span></p>
          {row.refund ? (
            <p className="mt-4 text-sm text-slate-600">
              {isRtl ? "استرداد يدوي COD" : "Manual COD refund"} · {row.refund.reference}
            </p>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              {isRtl ? "الدفع عند الاستلام: لا يُعتبر المبلغ مسترداً إلا بعد تسجيل المدير للمرجع يدوياً." : "COD: money is not refunded until an admin records a manual reference."}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
