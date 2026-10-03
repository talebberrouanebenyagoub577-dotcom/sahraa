"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function NewProductPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("dashboard");

  useEffect(() => {
    router.replace(`/${locale}/dashboard/seller/products`);
  }, [locale, router]);

  return (
    <DashboardLayout type="seller">
      <p className="text-slate-600">{t("sellerProductsReadOnly")}</p>
    </DashboardLayout>
  );
}
