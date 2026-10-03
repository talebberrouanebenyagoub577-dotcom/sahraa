"use client";



import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";



export default function AdminMarketingPage() {

  const locale = useLocale();

  const t = useTranslations("dashboard");



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("marketing")}</h1>

      <div className="grid gap-4 md:grid-cols-2">

        <div className="rounded-xl border bg-white p-6">

          <h3 className="font-bold">{t("marketingBanners")}</h3>

          <p className="mt-2 text-sm text-slate-600">{t("marketingBannersDesc")}</p>

        </div>

        <div className="rounded-xl border bg-white p-6">

          <h3 className="font-bold">{t("marketingNewsletter")}</h3>

          <p className="mt-2 text-sm text-slate-600">{t("marketingNewsletterDesc")}</p>

        </div>

        <div className="rounded-xl border bg-white p-6">

          <h3 className="font-bold">{t("marketingReferral")}</h3>

          <p className="mt-2 text-sm text-slate-600">{t("marketingReferralDesc")}</p>

        </div>

        <div className="rounded-xl border bg-white p-6">

          <h3 className="font-bold">{t("coupons")}</h3>

          <p className="mt-2 text-sm text-slate-600">

            <a href={`/${locale}/dashboard/admin/coupons`} className="text-amber-600 hover:underline">

              {t("manageCouponsLink")}

            </a>

          </p>

        </div>

      </div>

    </DashboardLayout>

  );

}


