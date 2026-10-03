import type { Locale } from "@/lib/constants";

type Bilingual = {
  name?: string | null;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  title?: string | null;
  titleAr?: string | null;
};

/** Locale for dates and general Intl formatting */
export function getIntlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-US";
}

/** Locale for currency/number display — French numerals when UI is Arabic */
export function getPriceLocale(locale: Locale): string {
  return locale === "ar" ? "fr-FR" : "en-US";
}

export function getLocalizedName(
  item: Bilingual,
  locale: Locale,
  fallback = ""
): string {
  if (locale === "ar") {
    return item.nameAr || item.name || fallback;
  }
  return item.name || item.nameAr || fallback;
}

export function getLocalizedDescription(
  item: Bilingual,
  locale: Locale,
  fallback = ""
): string {
  if (locale === "ar") {
    return item.descriptionAr || item.description || fallback;
  }
  return item.description || item.descriptionAr || fallback;
}

export function getLocalizedTitle(
  item: Bilingual,
  locale: Locale,
  fallback = ""
): string {
  if (locale === "ar") {
    return item.titleAr || item.title || fallback;
  }
  return item.title || item.titleAr || fallback;
}

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "sahraa-locale";

export function getOppositeLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

export function switchLocalePath(pathname: string, currentLocale: Locale): string {
  const target = getOppositeLocale(currentLocale);
  return pathname.replace(`/${currentLocale}`, `/${target}`);
}
