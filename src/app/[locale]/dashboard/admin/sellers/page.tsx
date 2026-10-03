"use client";



import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import toast from "react-hot-toast";



export default function AdminSellersPage() {

  const t = useTranslations("dashboard");

  const tc = useTranslations("common");

  const [sellers, setSellers] = useState([]);

  const [loading, setLoading] = useState(true);



  const load = () => {

    fetch("/api/admin/sellers")

      .then((r) => r.json())

      .then((d) => setSellers(d.data || []))

      .finally(() => setLoading(false));

  };



  useEffect(() => { load(); }, []);



  const updateStatus = async (sellerId: string, status: string) => {

    await fetch("/api/admin/sellers", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ sellerId, status }),

    });

    load();

    toast.success(t("updated"));

  };



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("sellerManagement")}</h1>

      <DataTable

        loading={loading}

        data={sellers}

        columns={[

          { key: "storeName", label: t("colStore") },

          { key: "email", label: tc("email"), render: (r) => (r.user as { email: string })?.email },

          { key: "status", label: t("colStatus"), render: (r) => <Badge>{String(r.status)}</Badge> },

          { key: "products", label: t("products"), render: (r) => String((r._count as { products: number })?.products || 0) },

          { key: "actions", label: "", render: (r) => (

            <div className="flex gap-1">

              <Button size="sm" onClick={() => updateStatus(String(r.id), "APPROVED")}>{t("approve")}</Button>

              <Button size="sm" variant="destructive" onClick={() => updateStatus(String(r.id), "SUSPENDED")}>{t("suspend")}</Button>

            </div>

          )},

        ]}

      />

    </DashboardLayout>

  );

}


