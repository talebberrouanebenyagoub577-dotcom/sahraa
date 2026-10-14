"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface FraudOrder {
  id: string;
  orderNumber: string;
  status: string;
  confirmationState: string;
  riskLevel: string;
  riskScore: number;
  reasons: string[];
  holdReason: string | null;
  phone: string;
  country: string;
  city: string;
  geoCountry: string | null;
  total: number;
  createdAt: string;
}

interface FraudStats {
  total: number;
  blocked: number;
  review: number;
  confirmationRate: number;
  deliveryRate: number;
  cancelRate: number;
  returnRate: number;
}

const REASON_AR: Record<string, string> = {
  geo_foreign: "الشبكة خارج السعودية",
  geo_unknown: "دولة الشبكة غير معروفة",
  vague_city: "مدينة غير واضحة",
  shared_device: "جهاز بأرقام متعددة",
  ip_velocity: "تكرار من نفس الشبكة",
  return_history: "إلغاء أو إرجاع متكرر",
  bot_ua: "سلوك آلي",
  country_not_sa: "شحن خارج السعودية",
  invalid_phone: "جوال غير صالح",
  blacklisted: "قائمة حظر",
  phone_velocity: "تكرار الجوال",
};

export default function AdminFraudPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [orders, setOrders] = useState<FraudOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiFetch("/api/admin/fraud")
      .then((response) => response.json())
      .then((body) => {
        setStats(body.data?.stats || null);
        setOrders(body.data?.orders || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, action: "accept" | "reject") => {
    const note = action === "reject"
      ? window.prompt(isAr ? "سبب الرفض" : "Rejection reason") || ""
      : "";
    const response = await apiFetch(`/api/admin/fraud/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    if (response.ok) {
      toast.success(isAr ? "تم حفظ القرار" : "Decision saved");
      load();
    } else {
      toast.error(isAr ? "تعذر تنفيذ القرار" : "Could not save the decision");
    }
  };

  return (
    <DashboardLayout type="admin">
      <h1 className="mb-2 text-2xl font-bold">{isAr ? "مراقبة الطلبات المشبوهة" : "Suspicious orders"}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {isAr
          ? "الجوال يظهر مخفياً. القبول يرسل حدث الشراء مرة واحدة، والرفض يلغي الطلب ولا يُرسل كطلب مؤكد."
          : "Phone numbers are masked. Accept sends the purchase event once. Reject cancels the order."}
      </p>
      {stats ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [isAr ? "محظور" : "Blocked", stats.blocked],
            [isAr ? "مراجعة" : "Review", stats.review],
            [isAr ? "تأكيد" : "Confirmed", `${stats.confirmationRate}%`],
            [isAr ? "تسليم" : "Delivered", `${stats.deliveryRate}%`],
            [isAr ? "إلغاء" : "Cancelled", `${stats.cancelRate}%`],
            [isAr ? "مرتجع" : "Returned", `${stats.returnRate}%`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-xl font-black">{value}</div>
            </div>
          ))}
        </div>
      ) : null}
      {loading ? <p>{isAr ? "جاري التحميل" : "Loading"}</p> : null}
      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong dir="ltr">{order.orderNumber}</strong>
              <Badge>{order.riskLevel}</Badge>
              <Badge>{order.confirmationState}</Badge>
              <span className="text-sm text-slate-500">{formatPrice(order.total, "SAR", locale)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {order.phone} · {order.country} · {order.city || "—"} · Geo {order.geoCountry || "—"}
            </p>
            <p className="mt-1 text-sm">{order.holdReason || order.reasons.map((reason) => REASON_AR[reason] || reason).join("، ")}</p>
            {order.confirmationState !== "CONFIRMED" && order.confirmationState !== "REJECTED" ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => decide(order.id, "accept")}>{isAr ? "قبول" : "Accept"}</Button>
                <Button size="sm" variant="outline" onClick={() => decide(order.id, "reject")}>{isAr ? "رفض" : "Reject"}</Button>
              </div>
            ) : null}
          </article>
        ))}
        {!loading && orders.length === 0 ? <p className="text-sm text-slate-500">{isAr ? "لا توجد طلبات معلّقة للمراجعة." : "No orders are waiting for review."}</p> : null}
      </div>
    </DashboardLayout>
  );
}
