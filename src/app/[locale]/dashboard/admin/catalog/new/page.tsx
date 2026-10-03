"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminProductForm } from "@/components/dashboard/AdminProductForm";
import toast from "react-hot-toast";

export default function AdminNewProductPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("dashboard");

  return (
    <DashboardLayout type="admin">
      <h1 className="mb-6 text-2xl font-bold">{t("addProduct")}</h1>
      <AdminProductForm
        onSuccess={() => {
          toast.success(t("productCreated"));
          router.push(`/${locale}/dashboard/admin/catalog`);
        }}
      />
    </DashboardLayout>
  );
}
