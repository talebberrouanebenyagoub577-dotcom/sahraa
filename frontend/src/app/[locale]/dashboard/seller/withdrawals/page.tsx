"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { formatPrice } from "@/lib/utils";

import toast from "react-hot-toast";



export default function SellerWithdrawalsPage() {

  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [withdrawals, setWithdrawals] = useState([]);

  const [amount, setAmount] = useState("");



  const load = () => {

    apiFetch("/api/seller/withdrawals")

      .then((r) => r.json())

      .then((d) => setWithdrawals(d.data || []));

  };



  useEffect(() => { load(); }, []);



  const request = async (e: React.FormEvent) => {

    e.preventDefault();

    const res = await apiFetch("/api/seller/withdrawals", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ amount: parseFloat(amount) }),

    });

    if (res.ok) { load(); setAmount(""); toast.success(t("requestSubmitted")); }

    else { const d = await res.json(); toast.error(d.error); }

  };



  return (

    <DashboardLayout type="seller">

      <h1 className="mb-6 text-2xl font-bold">{t("withdrawalRequests")}</h1>

      <form onSubmit={request} className="mb-6 flex gap-2 rounded-xl border bg-white p-4">

        <Input type="number" placeholder={t("amount")} value={amount} onChange={(e) => setAmount(e.target.value)} required />

        <Button type="submit">{t("requestWithdrawal")}</Button>

      </form>

      <DataTable

        data={withdrawals}

        columns={[

          { key: "amount", label: t("colAmount"), render: (r) => formatPrice(Number(r.amount), "SAR", locale) },

          { key: "status", label: t("colStatus"), render: (r) => <Badge>{String(r.status)}</Badge> },

          { key: "createdAt", label: t("colDate"), render: (r) => new Date(String(r.createdAt)).toLocaleDateString() },

        ]}

      />

    </DashboardLayout>

  );

}


