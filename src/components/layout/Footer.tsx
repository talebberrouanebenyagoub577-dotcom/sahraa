"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useSiteSettings } from "@/lib/context/SettingsContext";
import { SiteLogo } from "@/components/settings/SiteLogo";
import { SocialLinks } from "@/components/settings/SocialLinks";
import type { Locale } from "@/lib/constants";

export function Footer() {
  const locale = useLocale() as Locale;
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const settings = useSiteSettings();

  const links = [
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/contact`, label: t("contact") },
    { href: `/${locale}/terms`, label: t("terms") },
    { href: `/${locale}/privacy`, label: t("privacy") },
    { href: `/${locale}/help`, label: t("help") },
    { href: `/${locale}/sell`, label: t("sellOnSahraa") },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4">
              <SiteLogo nameClassName="text-xl font-bold text-white" />
            </div>
            <p className="text-sm leading-relaxed">{settings.siteDescription}</p>
            <SocialLinks className="mt-4" />
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">{tc("quickLinks")}</h4>
            <ul className="space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">{tc("customerService")}</h4>
            <ul className="space-y-2 text-sm">
              <li>{tc("codPolicy")}</li>
              <li>{tc("returnPolicy")}</li>
              <li>{tc("trackOrder")}</li>
              <li>{tc("faq")}</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">{tc("contactUs")}</h4>
            <ul className="space-y-2 text-sm">
              {settings.supportEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${settings.supportEmail}`} className="hover:text-amber-400">
                    {settings.supportEmail}
                  </a>
                </li>
              )}
              {settings.supportPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`} className="hover:text-amber-400">
                    {settings.supportPhone}
                  </a>
                </li>
              )}
              {settings.whatsappNumber && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-400"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-8 text-center text-sm">
          © {new Date().getFullYear()} {locale === "ar" ? tc("appName") : settings.siteName}. {tc("allRightsReserved")}
        </div>
      </div>
    </footer>
  );
}
