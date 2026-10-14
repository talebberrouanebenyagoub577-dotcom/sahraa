"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { Users, ShoppingCart, Package, DollarSign } from "lucide-react";

import { formatPrice } from "@/lib/utils";



export default function AdminDashboard() {

  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [stats, setStats] = useState({

    totalSales: 0,

    totalOrders: 0,

    totalUsers: 0,

    totalProducts: 0,

  });



  useEffect(() => {

    apiFetch("/api/admin/stats")

      .then((r) => r.json())

      .then((d) => d.data && setStats(d.data))

      .catch(() => null);

  }, []);



  const cards = [

    {

      label: t("totalSales"),

      value: formatPrice(stats.totalSales, "SAR", locale),

      icon: DollarSign,

      color: "bg-emerald-50 text-emerald-600",

    },

    {

      label: t("orders"),

      value: stats.totalOrders.toLocaleString(),

      icon: ShoppingCart,

      color: "bg-blue-50 text-blue-600",

    },

    {

      label: t("users"),

      value: stats.totalUsers.toLocaleString(),

      icon: Users,

      color: "bg-purple-50 text-purple-600",

    },

    {

      label: t("products"),

      value: stats.totalProducts.toLocaleString(),

      icon: Package,

      color: "bg-amber-50 text-amber-600",

    },

  ];



  return (

    <DashboardLayout type="admin">

      <h1 className="text-2xl font-bold">{t("adminTitle")}</h1>

      <p className="mt-1 text-slate-600">{t("adminSubtitle")}</p>



      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {cards.map((card) => {

          const Icon = card.icon;

          return (

            <div

              key={card.label}

              className="rounded-2xl border border-slate-100 bg-white p-6"

            >

              <div className={`inline-flex rounded-xl p-2 ${card.color}`}>

                <Icon className="h-5 w-5" />

              </div>

              <p className="mt-4 text-sm text-slate-500">{card.label}</p>

              <p className="text-2xl font-bold">{card.value}</p>

            </div>

          );

        })}

      </div>

    </DashboardLayout>

  );

}


