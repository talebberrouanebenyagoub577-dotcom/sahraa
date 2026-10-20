"use client";

import { createContext, useContext } from "react";

export interface SiteSettingsData {
  id: string;
  siteName: string;
  siteDescription: string;
  siteLogo: string | null;
  siteFavicon: string | null;
  domainName: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  twitterUrl: string | null;
  returnShippingCostDefault?: number;
  returnShippingBearer?: string;
  returnDeductShipping?: boolean;
  returnWindowDays?: number;
  updatedAt?: string;
}

const defaultSettings: SiteSettingsData = {
  id: "default",
  siteName: "SAHRAA",
  siteDescription: "The premier COD marketplace in the GCC region",
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

const SettingsContext = createContext<SiteSettingsData>(defaultSettings);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettingsData;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SettingsContext);
}
