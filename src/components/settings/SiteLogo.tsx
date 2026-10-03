"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useSiteSettings } from "@/lib/context/SettingsContext";

interface SiteLogoProps {
  className?: string;
  showName?: boolean;
  nameClassName?: string;
}

export function SiteLogo({ className = "h-10 w-10", showName = true, nameClassName }: SiteLogoProps) {
  const settings = useSiteSettings();
  const locale = useLocale();
  const t = useTranslations("common");
  const isAr = locale === "ar";
  const displayName = isAr ? t("appName") : settings.siteName;
  const badgeLetter = isAr ? "ص" : settings.siteName.charAt(0);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {settings.siteLogo ? (
        <Image
          src={settings.siteLogo}
          alt={displayName}
          width={40}
          height={40}
          className={`rounded-xl object-contain ${className}`}
        />
      ) : (
        <div className={`flex items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-900 ${className}`}>
          {badgeLetter}
        </div>
      )}
      {showName && (
        <span className={nameClassName || "hidden text-xl font-bold tracking-tight sm:block"}>
          {displayName}
        </span>
      )}
    </div>
  );
}
