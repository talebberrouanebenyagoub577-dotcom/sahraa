"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSiteSettings } from "@/lib/context/SettingsContext";
import { Package, Truck, Shield, Globe } from "lucide-react";

const FEATURE_KEYS = ["cod", "marketplace", "secure", "gcc"] as const;
const FEATURE_ICONS = { cod: Truck, marketplace: Package, secure: Shield, gcc: Globe };

export default function AboutPage() {
  const t = useTranslations("pages.about");
  const settings = useSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title", { siteName: settings.siteName })}</h1>
      <p className="mb-8 text-lg text-slate-600">{settings.siteDescription}</p>

      <div className="mb-10 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{t("missionTitle")}</h2>
        <p className="leading-relaxed text-slate-700">
          {t("missionBody", { siteName: settings.siteName })}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {FEATURE_KEYS.map((key) => {
          const Icon = FEATURE_ICONS[key];
          return (
            <div key={key} className="rounded-xl border bg-white p-6 shadow-sm">
              <Icon className="mb-3 h-8 w-8 text-amber-500" />
              <h3 className="mb-2 font-semibold">{t(`features.${key}.title`)}</h3>
              <p className="text-sm text-slate-600">{t(`features.${key}.desc`)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
