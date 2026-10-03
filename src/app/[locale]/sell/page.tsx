"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSiteSettings } from "@/lib/context/SettingsContext";
import { Store, TrendingUp, Users, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

const BENEFIT_KEYS = ["reach", "growth", "store", "support"] as const;
const BENEFIT_ICONS = { reach: Users, growth: TrendingUp, store: Store, support: Headphones };

export default function SellPage() {
  const locale = useLocale();
  const t = useTranslations("pages.sell");
  const tc = useTranslations("common");
  const settings = useSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title", { siteName: settings.siteName })}</h1>
      <p className="mb-8 text-lg text-slate-600">{t("subtitle")}</p>

      <div className="mb-10 grid gap-6 sm:grid-cols-2">
        {BENEFIT_KEYS.map((key) => {
          const Icon = BENEFIT_ICONS[key];
          return (
            <div key={key} className="rounded-xl border bg-white p-6 shadow-sm">
              <Icon className="mb-3 h-8 w-8 text-amber-500" />
              <h3 className="mb-2 font-semibold">{t(`benefits.${key}.title`)}</h3>
              <p className="text-sm text-slate-600">{t(`benefits.${key}.desc`)}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{t("getStarted")}</h2>
        <p className="mb-6 text-slate-600">{t("getStartedDesc")}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={`/${locale}/auth/register`}>
            <Button size="lg">{t("createAccount")}</Button>
          </Link>
          <Link href={`/${locale}/contact`}>
            <Button size="lg" variant="outline">{tc("contactUs")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
