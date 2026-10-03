"use client";



import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { formatPrice } from "@/lib/utils";



export default function SellerAnalyticsPage() {

  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [stats, setStats] = useState<Record<string, number>>({});



  useEffect(() => {

    fetch("/api/seller/stats")

      .then((r) => r.json())

      .then((d) => d.data && setStats(d.data));

  }, []);



  return (

    <DashboardLayout type="seller">

      <h1 className="mb-6 text-2xl font-bold">{t("analytics")}</h1>

      <div className="grid gap-4 md:grid-cols-3">

        {[

          { label: t("totalRevenue"), value: formatPrice(stats.totalRevenue || 0, "SAR", locale) },

          { label: t("totalOrders"), value: stats.totalOrders || 0 },

          { label: t("totalSales"), value: stats.totalSales || 0 },

          { label: t("products"), value: stats.totalProducts || 0 },

          { label: t("pendingOrders"), value: stats.pendingOrders || 0 },

          { label: t("storeRating"), value: stats.storeRating || 0 },

        ].map((item) => (

          <div key={item.label} className="rounded-xl border bg-white p-6">

            <p className="text-sm text-slate-500">{item.label}</p>

            <p className="mt-2 text-2xl font-bold">{item.value}</p>

          </div>

        ))}

      </div>

    </DashboardLayout>

  );

}


