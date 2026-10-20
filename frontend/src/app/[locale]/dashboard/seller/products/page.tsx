"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { formatPrice } from "@/lib/utils";

import { getLocalizedName } from "@/lib/i18n/display";

import type { Locale } from "@/lib/constants";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";



export default function SellerProductsPage() {

  const locale = useLocale() as Locale;

  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const isStoreAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [products, setProducts] = useState([]);



  useEffect(() => {

    apiFetch("/api/seller/products")

      .then((r) => r.json())

      .then((d) => setProducts(d.data || []));

  }, []);



  return (

    <DashboardLayout type="seller">

      <div className="mb-6">

        <h1 className="text-2xl font-bold">{t("myProducts")}</h1>

        <p className="mt-2 text-sm text-slate-600">{t("sellerProductsReadOnly")}</p>
        {isStoreAdmin && (
          <Link
            href={`/${locale}/dashboard/admin/catalog/new`}
            className="mt-4 inline-flex rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-amber-400"
          >
            {t("addProduct")}
          </Link>
        )}

      </div>

      <DataTable

        data={products}

        columns={[

          { key: "name", label: t("colProduct"), render: (r) => getLocalizedName(r as { name: string; nameAr: string }, locale) },

          { key: "sku", label: "SKU" },

          { key: "price", label: t("colPrice"), render: (r) => formatPrice(Number(r.price), "SAR", locale) },

          { key: "status", label: t("colStatus"), render: (r) => <Badge>{String(r.status)}</Badge> },

          { key: "soldCount", label: t("colSold") },

        ]}

      />

    </DashboardLayout>

  );

}


