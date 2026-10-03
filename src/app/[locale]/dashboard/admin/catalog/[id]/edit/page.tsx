"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  AdminProductForm,
  type AdminProductFormValues,
} from "@/components/dashboard/AdminProductForm";
import toast from "react-hot-toast";

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [initial, setInitial] = useState<Partial<AdminProductFormValues> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/catalog/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.data;
        if (!p) return;
        setInitial({
          name: p.name,
          nameAr: p.nameAr,
          description: p.description,
          descriptionAr: p.descriptionAr,
          categoryId: p.categoryId,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? "",
          sku: p.sku,
          quantity: p.inventory?.quantity ?? 0,
          codAvailable: p.codAvailable,
          status: p.status,
          imageLines: (p.images as { url: string }[] | undefined)
            ?.map((i) => i.url)
            .join("\n"),
        });
      });
  }, [id]);

  if (!initial) {
    return (
      <DashboardLayout type="admin">
        <p>{tc("loading")}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <h1 className="mb-6 text-2xl font-bold">{t("editProduct")}</h1>
      <AdminProductForm
        productId={id}
        initial={initial}
        onSuccess={() => {
          toast.success(t("updated"));
          router.push(`/${locale}/dashboard/admin/catalog`);
        }}
      />
    </DashboardLayout>
  );
}
