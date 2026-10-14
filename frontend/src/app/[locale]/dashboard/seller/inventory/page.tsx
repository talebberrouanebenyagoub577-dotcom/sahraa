"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { getLocalizedName } from "@/lib/i18n/display";

import type { Locale } from "@/lib/constants";

import toast from "react-hot-toast";



export default function SellerInventoryPage() {

  const locale = useLocale() as Locale;

  const t = useTranslations("dashboard");

  const [inventory, setInventory] = useState([]);



  const load = () => {

    apiFetch("/api/seller/inventory")

      .then((r) => r.json())

      .then((d) => setInventory(d.data || []));

  };



  useEffect(() => { load(); }, []);



  const updateStock = async (productId: string, quantity: number) => {

    await apiFetch("/api/seller/inventory", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ productId, quantity }),

    });

    load();

    toast.success(t("updated"));

  };



  return (

    <DashboardLayout type="seller">

      <h1 className="mb-6 text-2xl font-bold">{t("inventoryManagement")}</h1>

      <DataTable

        data={inventory}

        columns={[

          { key: "product", label: t("colProduct"), render: (r) => getLocalizedName((r.product as { name: string; nameAr: string }) || {}, locale) },

          { key: "sku", label: "SKU", render: (r) => String((r.product as { sku: string })?.sku) },

          { key: "quantity", label: t("colStock"), render: (r) => {

            const low = Number(r.quantity) <= Number(r.lowStockAlert);

            return <Badge variant={low ? "danger" : "success"}>{String(r.quantity)}</Badge>;

          }},

          { key: "actions", label: "", render: (r) => (

            <div className="flex gap-1">

              <Button size="sm" variant="outline" onClick={() => updateStock(String((r.product as { id: string }).id), Number(r.quantity) + 10)}>+10</Button>

              <Button size="sm" variant="outline" onClick={() => updateStock(String((r.product as { id: string }).id), Math.max(0, Number(r.quantity) - 1))}>-1</Button>

            </div>

          )},

        ]}

      />

    </DashboardLayout>

  );

}


