import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SUPPORTED_LOCALES } from "@/lib/constants";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatAssistant } from "@/components/ai/ChatAssistant";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { SettingsProvider, type SiteSettingsData } from "@/lib/context/SettingsContext";
import { getSiteSettings, getSiteBaseUrl, serializeSiteSettings } from "@/lib/settings";
import { LocalePersistence } from "@/components/layout/LocalePersistence";
import { Toaster } from "react-hot-toast";
import { PixelScripts } from "@/components/tracking/PixelScripts";
import { PageTracker } from "@/components/tracking/PageTracker";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSiteSettings();
  const baseUrl = getSiteBaseUrl(settings);
  const isAr = locale === "ar";
  const localePath = `${baseUrl}/${locale}`;
  const siteName = isAr ? "صحرا" : settings.siteName;

  return {
    title: {
      default: isAr
        ? `${siteName} | سوق الخليج للدفع عند الاستلام`
        : `${settings.siteName} | GCC COD Marketplace`,
      template: `%s | ${siteName}`,
    },
    description: settings.siteDescription,
    keywords: [siteName, "COD", "GCC", "marketplace", "الدفع عند الاستلام", "صحرا", "SAHRAA"],
    authors: [{ name: siteName }],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: localePath,
      languages: {
        ar: `${baseUrl}/ar`,
        en: `${baseUrl}/en`,
        "x-default": `${baseUrl}/ar`,
      },
    },
    openGraph: {
      type: "website",
      locale: isAr ? "ar_SA" : "en_US",
      alternateLocale: isAr ? ["en_US"] : ["ar_SA"],
      siteName: settings.siteName,
      title: settings.siteName,
      description: settings.siteDescription,
      url: localePath,
      ...(settings.siteLogo ? { images: [{ url: settings.siteLogo }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteName,
      description: settings.siteDescription,
      ...(settings.siteLogo ? { images: [settings.siteLogo] } : {}),
    },
    icons: {
      icon: settings.siteFavicon || "/favicon.ico",
      shortcut: settings.siteFavicon || "/favicon.ico",
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale as "ar" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const dbSettings = await getSiteSettings();
  const settings: SiteSettingsData = serializeSiteSettings(dbSettings);

  return (
    <div lang={locale} dir={dir}>
      <PixelScripts />
      <PageTracker />
      <NextIntlClientProvider messages={messages}>
        <SettingsProvider settings={settings}>
          <AuthProvider>
            <CartProvider>
              <LocalePersistence />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
              <CheckoutModal />
              <ChatAssistant />
              <Toaster
                position={dir === "rtl" ? "top-left" : "top-right"}
                toastOptions={{
                  style: {
                    background: "#111827",
                    color: "#f1f5f9",
                    border: "1px solid #334155",
                  },
                }}
              />
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </NextIntlClientProvider>
    </div>
  );
}
