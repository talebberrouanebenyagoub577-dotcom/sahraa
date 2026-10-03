"use client";



import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { BarChart3, DollarSign, Package, ShoppingCart } from "lucide-react";

import { formatPrice } from "@/lib/utils";



export default function SellerDashboard() {

  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0, lowStockItems: 0 });



  useEffect(() => {

    fetch("/api/seller/stats")

      .then((r) => r.json())

      .then((d) => d.data && setStats(d.data));

  }, []);



  const cards = [

    { label: t("products"), value: stats.totalProducts, icon: Package },

    { label: t("orders"), value: stats.totalOrders, icon: ShoppingCart },

    { label: t("revenue"), value: formatPrice(stats.totalRevenue, "SAR", locale), icon: DollarSign },

    { label: t("lowStock"), value: stats.lowStockItems, icon: BarChart3 },

  ];



  return (

    <DashboardLayout type="seller">

      <h1 className="text-2xl font-bold">{t("sellerTitle")}</h1>

      <p className="mt-1 text-slate-600">{t("sellerPendingOrders", { count: stats.pendingOrders })}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {cards.map((stat) => {

          const Icon = stat.icon;

          return (

            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-6">

              <div className="flex items-center justify-between">

                <p className="text-sm text-slate-500">{stat.label}</p>

                <Icon className="h-5 w-5 text-amber-500" />

              </div>

              <p className="mt-2 text-2xl font-bold">{stat.value}</p>

            </div>

          );

        })}

      </div>

    </DashboardLayout>

  );

}


