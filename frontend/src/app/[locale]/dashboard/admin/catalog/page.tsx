"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";
import toast from "react-hot-toast";

export default function AdminCatalogPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/api/admin/catalog/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/api/admin/catalog/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(t("updated"));
      load();
    } else toast.error((await res.json()).error);
  };

  const remove = async (id: string) => {
    if (!confirm(t("confirmDeleteProduct"))) return;
    const res = await apiFetch(`/api/admin/catalog/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("productDeleted"));
      load();
    } else toast.error((await res.json()).error);
  };

  return (
    <DashboardLayout type="admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("adminCatalog")}</h1>
          <p className="text-sm text-slate-500">{t("catalogSubtitle")}</p>
        </div>
        <Link href={`/${locale}/dashboard/admin/catalog/new`}>
          <Button>{t("addProduct")}</Button>
        </Link>
      </div>

      {!loading && products.length === 0 ? (
        <p className="text-slate-500">{t("noCatalogProducts")}</p>
      ) : (
        <DataTable
          loading={loading}
          data={products}
          columns={[
            {
              key: "name",
              label: t("colProduct"),
              render: (r) =>
                getLocalizedName(r as { name: string; nameAr: string }, locale),
            },
            {
              key: "price",
              label: t("colPrice"),
              render: (r) => formatPrice(Number(r.price), "SAR", locale),
            },
            {
              key: "stock",
              label: t("quantity"),
              render: (r) =>
                String((r.inventory as { quantity: number } | null)?.quantity ?? 0),
            },
            {
              key: "status",
              label: t("colStatus"),
              render: (r) => <Badge>{String(r.status)}</Badge>,
            },
            {
              key: "actions",
              label: "",
              render: (r) => {
                const id = String(r.id);
                const status = String(r.status);
                return (
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/${locale}/dashboard/admin/catalog/${id}/edit`}>
                      <Button size="sm" variant="outline">
                        {t("editProduct")}
                      </Button>
                    </Link>
                    {status === "APPROVED" ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus(id, "DRAFT")}>
                        {t("unpublishProduct")}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setStatus(id, "APPROVED")}>
                        {t("publishProduct")}
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => remove(id)}>
                      {t("deleteProduct")}
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
}
