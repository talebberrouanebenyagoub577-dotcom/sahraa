"use client";



import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { formatPrice } from "@/lib/utils";

import toast from "react-hot-toast";



export default function AdminOrdersPage() {

  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);



  const load = () => {

    fetch("/api/orders?limit=50")

      .then((r) => r.json())

      .then((d) => setOrders(d.data?.orders || []))

      .finally(() => setLoading(false));

  };



  useEffect(() => { load(); }, []);



  const updateStatus = async (id: string, status: string) => {

    const res = await fetch(`/api/orders/${id}`, {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ status, note: `Status updated to ${status}` }),

    });

    if (res.ok) { load(); toast.success(t("updated")); }

  };



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("orderManagement")}</h1>

      <DataTable

        loading={loading}

        data={orders}

        columns={[

          { key: "orderNumber", label: t("colOrderNumber") },

          { key: "status", label: t("colStatus"), render: (r) => <Badge>{String(r.status)}</Badge> },

          { key: "total", label: t("colTotal"), render: (r) => formatPrice(Number(r.total), "SAR", locale) },

          { key: "paymentMethod", label: t("colPayment") },

          { key: "createdAt", label: t("colDate"), render: (r) => new Date(String(r.createdAt)).toLocaleDateString() },

          { key: "actions", label: "", render: (r) => (

            <div className="flex gap-1">

              {["CONFIRMED", "SHIPPED", "DELIVERED"].map((s) => (

                <Button key={s} size="sm" variant="outline" onClick={() => updateStatus(String(r.id), s)}>{s}</Button>

              ))}

            </div>

          )},

        ]}

      />

    </DashboardLayout>

  );

}


