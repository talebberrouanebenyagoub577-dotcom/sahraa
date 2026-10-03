"use client";



import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { formatPrice } from "@/lib/utils";

import { getLocalizedName } from "@/lib/i18n/display";

import type { Locale } from "@/lib/constants";

import toast from "react-hot-toast";



export default function AdminProductsPage() {

  const locale = useLocale() as Locale;

  const t = useTranslations("dashboard");

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);



  const load = () => {

    fetch("/api/admin/products")

      .then((r) => r.json())

      .then((d) => setProducts(d.data || []))

      .finally(() => setLoading(false));

  };



  useEffect(() => { load(); }, []);



  const moderate = async (productId: string, status: string) => {

    await fetch("/api/admin/products", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ productId, status }),

    });

    load();

    toast.success(t("updated"));

  };



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("moderation")}</h1>

      <DataTable

        loading={loading}

        data={products}

        columns={[

          { key: "name", label: t("colProduct"), render: (r) => getLocalizedName(r as { name: string; nameAr: string }, locale) },

          { key: "seller", label: t("colSeller"), render: (r) => String((r.seller as { storeName: string })?.storeName) },

          { key: "price", label: t("colPrice"), render: (r) => formatPrice(Number(r.price), "SAR", locale) },

          { key: "status", label: t("colStatus"), render: (r) => <Badge>{String(r.status)}</Badge> },

          { key: "actions", label: "", render: (r) => (

            <div className="flex gap-1">

              <Button size="sm" onClick={() => moderate(String(r.id), "APPROVED")}>{t("approve")}</Button>

              <Button size="sm" variant="destructive" onClick={() => moderate(String(r.id), "REJECTED")}>{t("reject")}</Button>

            </div>

          )},

        ]}

      />

    </DashboardLayout>

  );

}


