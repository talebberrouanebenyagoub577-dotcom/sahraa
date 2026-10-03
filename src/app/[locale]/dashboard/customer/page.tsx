"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Package, Heart, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function CustomerDashboard() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.data))
      .catch(() => null);
  }, []);

  const cards = [
    { href: `/${locale}/dashboard/customer/orders`, icon: Package, label: t("myOrders"), desc: t("myOrdersDesc") },
    { href: `/${locale}/dashboard/customer/wishlist`, icon: Heart, label: t("wishlist"), desc: t("wishlistDesc") },
    { href: `/${locale}/dashboard/customer/addresses`, icon: MapPin, label: t("addresses"), desc: t("addressesDesc") },
    { href: `/${locale}/dashboard/customer/support`, icon: MessageSquare, label: t("support"), desc: t("supportDesc") },
  ];

  return (
    <DashboardLayout type="customer">
      <div>
        <h1 className="mb-2 text-2xl font-bold">
          {t("welcome")}{user ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mb-8 text-slate-600">{t("overview")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="flex items-start gap-4 rounded-xl border bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="rounded-lg bg-amber-100 p-3">
                  <Icon className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{card.label}</h3>
                  <p className="text-sm text-slate-500">{card.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
