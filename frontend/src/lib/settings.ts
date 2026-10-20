import { apiUrl } from "@/lib/api";
import type { SiteSettingsData } from "@/lib/context/SettingsContext";

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  id: "default",
  siteName: "SAHRAA",
  siteDescription:
    "The premier COD marketplace in the GCC region. Shop with Cash on Delivery across Saudi Arabia.",
  siteLogo: null,
  siteFavicon: null,
  domainName: null,
  supportEmail: "support@sahraaaaaaaaaaa.shop",
  supportPhone: "+966500000000",
  whatsappNumber: "+966500000000",
  facebookUrl: null,
  tiktokUrl: null,
  snapchatUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  twitterUrl: null,
  returnShippingCostDefault: 0,
  returnShippingBearer: "CUSTOMER",
  returnDeductShipping: true,
  returnWindowDays: 14,
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const response = await fetch(apiUrl("/api/settings"), { cache: "no-store" });
    if (!response.ok) return DEFAULT_SITE_SETTINGS;
    const json = (await response.json()) as { data?: SiteSettingsData };
    return { ...DEFAULT_SITE_SETTINGS, ...(json.data || {}) };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function getSiteBaseUrl(settings?: { domainName?: string | null }): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "https://sahraaaaaaaaaaa.shop").replace(/\/$/, "");
  const domain = settings?.domainName?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (domain && domain.endsWith("sahraaaaaaaaaaa.shop")) return `https://${domain}`;
  return configured;
}

export function serializeSiteSettings(settings: SiteSettingsData): SiteSettingsData {
  return settings;
}
