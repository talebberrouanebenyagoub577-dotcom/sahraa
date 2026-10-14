"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import toast from "react-hot-toast";



export default function AdminCouponsPage() {

  const t = useTranslations("dashboard");

  const tc = useTranslations("common");

  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: 10 });



  const load = () => {

    apiFetch("/api/admin/coupons")

      .then((r) => r.json())

      .then((d) => setCoupons(d.data || []))

      .finally(() => setLoading(false));

  };



  useEffect(() => { load(); }, []);



  const create = async (e: React.FormEvent) => {

    e.preventDefault();

    const res = await apiFetch("/api/admin/coupons", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(form),

    });

    if (res.ok) { load(); toast.success(t("created")); setForm({ code: "", discountType: "percentage", discountValue: 10 }); }

  };



  const toggle = async (id: string, isActive: boolean) => {

    await apiFetch("/api/admin/coupons", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ id, isActive: !isActive }),

    });

    load();

  };



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("couponManagement")}</h1>

      <form onSubmit={create} className="mb-6 flex gap-2 rounded-xl border bg-white p-4">

        <Input placeholder={t("colCode")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />

        <Input type="number" placeholder={t("colValue")} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: +e.target.value })} required />

        <Button type="submit">{tc("create")}</Button>

      </form>

      <DataTable

        loading={loading}

        data={coupons}

        columns={[

          { key: "code", label: t("colCode") },

          { key: "discountValue", label: t("colDiscount"), render: (r) => `${r.discountValue}${r.discountType === "percentage" ? "%" : " SAR"}` },

          { key: "usedCount", label: t("colUsed") },

          { key: "isActive", label: t("colStatus"), render: (r) => <Badge variant={r.isActive ? "success" : "danger"}>{r.isActive ? tc("active") : tc("inactive")}</Badge> },

          { key: "actions", label: "", render: (r) => (

            <Button size="sm" variant="outline" onClick={() => toggle(String(r.id), Boolean(r.isActive))}>{tc("toggle")}</Button>

          )},

        ]}

      />

    </DashboardLayout>

  );

}


