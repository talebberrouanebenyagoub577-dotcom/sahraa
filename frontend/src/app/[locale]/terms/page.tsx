"use client";

import { useTranslations } from "next-intl";
import { useSiteSettings } from "@/lib/context/SettingsContext";

const SECTION_KEYS = ["acceptance", "accounts", "orders", "shipping", "returns", "liability"] as const;

export default function TermsPage() {
  const t = useTranslations("pages.terms");
  const settings = useSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
      <p className="mb-8 text-sm text-slate-500">{t("lastUpdated")}</p>

      <div className="space-y-6">
        {SECTION_KEYS.map((key) => (
          <section key={key} className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">{t(`sections.${key}.title`)}</h2>
            <p className="leading-relaxed text-slate-700">
              {t(`sections.${key}.body`, { siteName: settings.siteName })}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
