"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSiteSettings } from "@/lib/context/SettingsContext";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ_KEYS = ["track", "payment", "delivery", "return", "support"] as const;

export default function HelpPage() {
  const locale = useLocale();
  const t = useTranslations("pages.help");
  const tc = useTranslations("common");
  const settings = useSiteSettings();
  const [open, setOpen] = useState<number | null>(0);
  const email = settings.supportEmail || "support@sahraa.com";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
      <p className="mb-8 text-slate-600">
        {t("subtitle", { siteName: settings.siteName })}
      </p>

      <div className="mb-8 space-y-3">
        {FAQ_KEYS.map((key, i) => (
          <div key={key} className="rounded-xl border bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-4 text-start font-medium"
            >
              {t(`faqs.${key}.q`)}
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <p className="border-t px-4 pb-4 pt-2 text-sm leading-relaxed text-slate-600">
                {t(`faqs.${key}.a`, { email })}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-amber-50 p-6 text-center">
        <p className="mb-3 text-slate-700">{t("noAnswer")}</p>
        <Link
          href={`/${locale}/contact`}
          className="inline-block rounded-lg bg-amber-500 px-6 py-2 font-medium text-slate-900 hover:bg-amber-400"
        >
          {tc("contactUs")}
        </Link>
      </div>
    </div>
  );
}
