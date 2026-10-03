"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";

/** Syncs active locale to cookie + localStorage for persistence across visits. */
export function LocalePersistence() {
  const locale = useLocale() as Locale;

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  }, [locale]);

  return null;
}
