import type { CountryCode, Currency } from "@/lib/enums";

export const APP_NAME = "SAHRAA";
export const APP_NAME_AR = "صحرا";

export const SUPPORTED_LOCALES = ["ar", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export const GCC_COUNTRIES: {
  code: CountryCode;
  name: { ar: string; en: string };
  currency: Currency;
  flag: string;
}[] = [
  {
    code: "SA",
    name: { ar: "السعودية", en: "Saudi Arabia" },
    currency: "SAR",
    flag: "🇸🇦",
  },
  {
    code: "AE",
    name: { ar: "الإمارات", en: "UAE" },
    currency: "AED",
    flag: "🇦🇪",
  },
  {
    code: "KW",
    name: { ar: "الكويت", en: "Kuwait" },
    currency: "KWD",
    flag: "🇰🇼",
  },
  {
    code: "QA",
    name: { ar: "قطر", en: "Qatar" },
    currency: "QAR",
    flag: "🇶🇦",
  },
  {
    code: "BH",
    name: { ar: "البحرين", en: "Bahrain" },
    currency: "BHD",
    flag: "🇧🇭",
  },
  {
    code: "OM",
    name: { ar: "عُمان", en: "Oman" },
    currency: "OMR",
    flag: "🇴🇲",
  },
];

export const SHIPPING_PROVIDERS = [
  { id: "ARAMEX", name: { ar: "أرامكس", en: "Aramex" } },
  { id: "SMSA", name: { ar: "سمسا", en: "SMSA" } },
  { id: "JT", name: { ar: "جي آند تي", en: "J&T Express" } },
  { id: "DHL", name: { ar: "دي إتش إل", en: "DHL" } },
  { id: "CUSTOM", name: { ar: "شحن مخصص", en: "Custom Shipping" } },
];

export const PRODUCT_SECTIONS = [
  "featured",
  "trending",
  "bestSellers",
  "flashDeals",
  "newArrivals",
  "aiRecommended",
] as const;
