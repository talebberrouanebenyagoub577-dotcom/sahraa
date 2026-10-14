import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CountryCode, Currency } from "@/lib/enums";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";
import { getPriceLocale } from "@/lib/i18n/display";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function resolvePriceIntlLocale(locale: string): string {
  if (locale === "ar" || locale === "en") {
    return getPriceLocale(locale as Locale);
  }
  return locale;
}

export function formatPrice(
  amount: number,
  currency: Currency = Currency.SAR,
  locale: string = DEFAULT_LOCALE
): string {
  const currencyMap: Record<Currency, string> = {
    SAR: "SAR",
    AED: "AED",
    KWD: "KWD",
    QAR: "QAR",
    BHD: "BHD",
    OMR: "OMR",
  };

  return new Intl.NumberFormat(resolvePriceIntlLocale(locale), {
    style: "currency",
    currency: currencyMap[currency],
    minimumFractionDigits: currency === Currency.KWD || currency === Currency.BHD ? 3 : 2,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SHR-${timestamp}-${random}`;
}

export function generateTicketNumber(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCountryName(
  code: CountryCode,
  locale: "ar" | "en" = "ar"
): string {
  const names: Record<CountryCode, { ar: string; en: string }> = {
    SA: { ar: "المملكة العربية السعودية", en: "Saudi Arabia" },
    AE: { ar: "الإمارات العربية المتحدة", en: "United Arab Emirates" },
    KW: { ar: "الكويت", en: "Kuwait" },
    QA: { ar: "قطر", en: "Qatar" },
    BH: { ar: "البحرين", en: "Bahrain" },
    OM: { ar: "عُمان", en: "Oman" },
  };
  return names[code][locale];
}

export function getCurrencyForCountry(country: CountryCode): Currency {
  const map: Record<CountryCode, Currency> = {
    SA: Currency.SAR,
    AE: Currency.AED,
    KW: Currency.KWD,
    QA: Currency.QAR,
    BH: Currency.BHD,
    OM: Currency.OMR,
  };
  return map[country];
}

export function calculateDiscount(
  subtotal: number,
  type: string,
  value: number,
  maxDiscount?: number | null
): number {
  let discount = type === "percentage" ? (subtotal * value) / 100 : value;
  if (maxDiscount) discount = Math.min(discount, maxDiscount);
  return Math.min(discount, subtotal);
}

export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }
  return matrix[b.length][a.length];
}
