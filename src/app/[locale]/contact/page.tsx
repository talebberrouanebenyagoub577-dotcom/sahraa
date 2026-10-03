"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSiteSettings } from "@/lib/context/SettingsContext";
import { SocialLinks } from "@/components/settings/SocialLinks";
import { Mail, Phone, MessageCircle, Globe } from "lucide-react";

export default function ContactPage() {
  const locale = useLocale();
  const t = useTranslations("pages.contact");
  const tc = useTranslations("common");
  const settings = useSiteSettings();

  const baseUrl = settings.domainName ? `https://${settings.domainName}` : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
      <p className="mb-8 text-slate-600">
        {t("subtitle", { siteName: settings.siteName })}
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("infoTitle")}</h2>

          {settings.supportEmail && (
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-500">{t("email")}</p>
                <a href={`mailto:${settings.supportEmail}`} className="text-slate-900 hover:text-amber-600">
                  {settings.supportEmail}
                </a>
              </div>
            </div>
          )}

          {settings.supportPhone && (
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-500">{t("phone")}</p>
                <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="text-slate-900 hover:text-amber-600">
                  {settings.supportPhone}
                </a>
              </div>
            </div>
          )}

          {settings.whatsappNumber && (
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-500">WhatsApp</p>
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 hover:text-amber-600"
                >
                  {settings.whatsappNumber}
                </a>
              </div>
            </div>
          )}

          {settings.domainName && (
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-500">{t("website")}</p>
                <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:text-amber-600">
                  {settings.domainName}
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{tc("followUs")}</h2>
          <p className="mb-4 text-sm text-slate-600">{t("followSubtitle")}</p>
          <SocialLinks iconClassName="h-5 w-5" />
          <p className="mt-6 text-sm text-slate-500">{settings.siteDescription}</p>
        </div>
      </div>
    </div>
  );
}
