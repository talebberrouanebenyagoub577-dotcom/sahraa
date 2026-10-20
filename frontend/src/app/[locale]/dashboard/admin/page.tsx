"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Users, ShoppingCart, Package, DollarSign, Plus, LayoutGrid } from "lucide-react";
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

  const shortcuts = [
    { href: `/${locale}/dashboard/admin/catalog`, label: t("products"), desc: t("catalogSubtitle"), icon: Package },
    { href: `/${locale}/dashboard/admin/catalog/new`, label: t("addProduct"), desc: t("newProduct"), icon: Plus },
    { href: `/${locale}/dashboard/admin/orders`, label: t("orders"), desc: t("orderManagement"), icon: ShoppingCart },
    { href: `/${locale}/dashboard/admin/categories`, label: t("categoriesNav"), desc: t("categoriesSubtitle"), icon: LayoutGrid },
  ];

  return (
    <DashboardLayout type="admin">
      <h1 className="text-2xl font-bold">{t("adminTitle")}</h1>
      <p className="mt-1 text-slate-600">{t("adminSubtitle")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className={`inline-flex rounded-xl p-2 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-colors hover:border-amber-300"
            >
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
