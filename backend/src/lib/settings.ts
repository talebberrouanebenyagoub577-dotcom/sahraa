import prisma from "@/lib/prisma";
import type { SiteSettings } from "@prisma/client";

export const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, "updatedAt" | "updatedBy"> = {
  id: "default",
  siteName: "SAHRAA",
  siteDescription:
    "The premier COD marketplace in the GCC region. Shop electronics, fashion, home & more with Cash on Delivery across Saudi Arabia, UAE, Kuwait, Qatar, Bahrain & Oman.",
  siteLogo: null,
  siteFavicon: null,
  domainName: null,
  supportEmail: "support@sahraa.com",
  supportPhone: "+966 11 000 0000",
  whatsappNumber: "+966500000000",
  facebookUrl: null,
  tiktokUrl: null,
  snapchatUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  twitterUrl: null,
};

export type PublicSiteSettings = SiteSettings;

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (settings) return settings;

    return await prisma.siteSettings.create({
      data: DEFAULT_SITE_SETTINGS,
    });
  } catch {
    return {
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: new Date(),
      updatedBy: null,
    };
  }
}

export function getSiteBaseUrl(settings: PublicSiteSettings): string {
  if (settings.domainName) {
    const domain = settings.domainName.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${domain}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function serializeSiteSettings(settings: PublicSiteSettings) {
  return {
    id: settings.id,
    siteName: settings.siteName,
    siteDescription: settings.siteDescription,
    siteLogo: settings.siteLogo,
    siteFavicon: settings.siteFavicon,
    domainName: settings.domainName,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    whatsappNumber: settings.whatsappNumber,
    facebookUrl: settings.facebookUrl,
    tiktokUrl: settings.tiktokUrl,
    snapchatUrl: settings.snapchatUrl,
    instagramUrl: settings.instagramUrl,
    youtubeUrl: settings.youtubeUrl,
    twitterUrl: settings.twitterUrl,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
