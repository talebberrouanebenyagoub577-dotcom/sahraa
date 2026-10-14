import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderConfirmation } from "@/components/orders/OrderConfirmation";

const ORDER_ID_PATTERN = /^[a-zA-Z0-9_-]{10,64}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "orderSuccess" });

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false, nocache: true },
    alternates: { canonical: null, languages: {} },
  };
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);

  return (
    <OrderConfirmation
      orderId={orderId}
      isValidId={ORDER_ID_PATTERN.test(orderId)}
    />
  );
}
