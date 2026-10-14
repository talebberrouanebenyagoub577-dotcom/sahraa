"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { formatPrice } from "@/lib/utils";

import toast from "react-hot-toast";



export default function AdminCodNetworkPage() {

  const locale = useLocale();
  const t = useTranslations("dashboard");

  const tc = useTranslations("common");

  const [data, setData] = useState<{ suppliers: Record<string, unknown>[]; offers: Record<string, unknown>[]; commissions: Record<string, unknown>[]; totalEarned: number } | null>(null);

  const [supplierForm, setSupplierForm] = useState({ name: "", email: "", country: "SA" });



  const load = () => {

    apiFetch("/api/admin/cod-network")

      .then((r) => r.json())

      .then((d) => setData(d.data))

      .catch(() => {});

  };



  useEffect(() => { load(); }, []);



  const addSupplier = async (e: React.FormEvent) => {

    e.preventDefault();

    await apiFetch("/api/admin/cod-network", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ type: "supplier", ...supplierForm }),

    });

    load();

    toast.success(t("supplierAdded"));

  };



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-2 text-2xl font-bold">{t("codNetwork")}</h1>

      <p className="mb-6 text-slate-600">{t("totalEarned")}: {formatPrice(data?.totalEarned || 0, "SAR", locale)}</p>



      <form onSubmit={addSupplier} className="mb-6 flex gap-2 rounded-xl border bg-white p-4">

        <Input placeholder={t("supplierName")} value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required />

        <Input type="email" placeholder={tc("email")} value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} required />

        <Button type="submit">{t("addSupplier")}</Button>

      </form>



      <h2 className="mb-3 font-bold">{t("suppliers")}</h2>

      <DataTable data={data?.suppliers || []} columns={[

        { key: "name", label: t("colName") },

        { key: "email", label: tc("email") },

        { key: "country", label: t("colCountry") },

      ]} />



      <h2 className="mb-3 mt-8 font-bold">{t("commissions")}</h2>

      <DataTable data={data?.commissions || []} columns={[

        { key: "amount", label: t("colAmount"), render: (r) => formatPrice(Number(r.amount), "SAR", locale) },

        { key: "status", label: t("colStatus") },

        { key: "order", label: t("orders"), render: (r) => String((r.order as { orderNumber: string })?.orderNumber) },

      ]} />

    </DashboardLayout>

  );

}


