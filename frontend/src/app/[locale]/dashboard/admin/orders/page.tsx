"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAdminItemLine } from "@/lib/admin/order-display";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface AdminOrderItem {
  name?: string;
  nameAr?: string | null;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod?: string;
  total: number;
  currency?: string;
  createdAt: string;
  items?: AdminOrderItem[];
  customer?: { fullName: string; phone: string; city: string };
}

export default function AdminOrdersPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch("/api/orders?limit=50");
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || t("loadFailed"));
        setOrders([]);
        return;
      }
      setOrders((body.data?.orders || []) as AdminOrder[]);
    } catch {
      toast.error(t("loadFailed"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load(false);
    const timer = window.setInterval(() => void load(true), 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: `Status updated to ${status}` }),
    });
    if (res.ok) {
      void load();
      toast.success(t("updated"));
    }
  };

  return (
    <DashboardLayout type="admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("orderManagement")}</h1>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {t("refreshOrders")}
        </Button>
      </div>
      <DataTable
        loading={loading}
        emptyMessage={t("noOrders")}
        data={orders as unknown as Record<string, unknown>[]}
        onRowClick={(row) => router.push(`/${locale}/dashboard/admin/orders/${String(row.id)}`)}
        columns={[
          { key: "orderNumber", label: t("colOrderNumber") },
          {
            key: "customer",
            label: t("colCustomer"),
            render: (row) => String((row.customer as AdminOrder["customer"])?.fullName || "—"),
          },
          {
            key: "phone",
            label: t("colPhone"),
            render: (row) => String((row.customer as AdminOrder["customer"])?.phone || "—"),
          },
          {
            key: "city",
            label: t("colCity"),
            render: (row) => String((row.customer as AdminOrder["customer"])?.city || "—"),
          },
          {
            key: "items",
            label: t("colProducts"),
            render: (row) => {
              const items = (row.items as AdminOrderItem[]) || [];
              return items.length
                ? items.map((item) => formatAdminItemLine(item, locale)).join(locale === "ar" ? "، " : ", ")
                : "—";
            },
          },
          {
            key: "total",
            label: t("colTotal"),
            render: (row) => formatPrice(Number(row.total), "SAR", locale),
          },
          {
            key: "status",
            label: t("colStatus"),
            render: (row) => <Badge>{String(row.status)}</Badge>,
          },
          {
            key: "createdAt",
            label: t("colDate"),
            render: (row) => new Date(String(row.createdAt)).toLocaleString(locale === "ar" ? "ar-SA" : "en-GB"),
          },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                {["CONFIRMED", "SHIPPED", "DELIVERED"].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(String(row.id), status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            ),
          },
        ]}
      />
    </DashboardLayout>
  );
}
