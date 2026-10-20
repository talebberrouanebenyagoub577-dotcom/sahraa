"use client";

import { apiFetch } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";
import toast from "react-hot-toast";

type CatalogRow = {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  status: string;
  sku: string;
  categoryId: string;
  category?: { name: string; nameAr: string };
  inventory?: { quantity: number } | null;
  images?: { url: string; isPrimary?: boolean }[];
};

export default function AdminCatalogPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [products, setProducts] = useState<CatalogRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; nameAr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(timer);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (status) params.set("status", status);
    if (categoryId) params.set("categoryId", categoryId);
    const query = params.toString();
    apiFetch(`/api/admin/catalog/products${query ? `?${query}` : ""}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          toast.error(d.error || tc("error"));
          setProducts([]);
          return;
        }
        setProducts(Array.isArray(d.data) ? d.data : []);
      })
      .catch(() => {
        toast.error(tc("error"));
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedQ, status, categoryId, tc]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiFetch("/api/admin/catalog/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => null);
  }, []);

  const setProductStatus = async (id: string, next: string) => {
    const res = await apiFetch(`/api/admin/catalog/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
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
        <Link
          href={`/${locale}/dashboard/admin/catalog/new`}
          className="inline-flex items-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-amber-400"
        >
          {t("addProduct")}
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchProducts")}
        />
        <select
          className="rounded-lg border p-2 text-sm"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">{t("filterAllCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getLocalizedName(category, locale)}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border p-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{t("filterAllStatuses")}</option>
          <option value="APPROVED">{t("statusApproved")}</option>
          <option value="DRAFT">{t("statusDraft")}</option>
          <option value="ARCHIVED">{t("statusArchived")}</option>
        </select>
      </div>

      {!loading && products.length === 0 ? (
        <p className="text-slate-500">{t("noCatalogProducts")}</p>
      ) : (
        <DataTable
          loading={loading}
          data={products as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: "image",
              label: t("productPhotos"),
              render: (r) => {
                const images = (r.images as CatalogRow["images"]) || [];
                const url = mediaUrl(images.find((image) => image.isPrimary)?.url || images[0]?.url);
                return url ? (
                  <Image src={url} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" unoptimized />
                ) : (
                  "—"
                );
              },
            },
            {
              key: "name",
              label: t("colProduct"),
              render: (r) => getLocalizedName(r as { name: string; nameAr: string }, locale),
            },
            {
              key: "sku",
              label: "SKU",
              render: (r) => String(r.sku || "—"),
            },
            {
              key: "category",
              label: t("categoriesNav"),
              render: (r) =>
                r.category
                  ? getLocalizedName(r.category as { name: string; nameAr: string }, locale)
                  : "—",
            },
            {
              key: "price",
              label: t("colPrice"),
              render: (r) => formatPrice(Number(r.price), "SAR", locale),
            },
            {
              key: "stock",
              label: t("quantity"),
              render: (r) => String((r.inventory as { quantity: number } | null)?.quantity ?? 0),
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
                const current = String(r.status);
                return (
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/${locale}/dashboard/admin/catalog/${id}/edit`}>
                      <Button size="sm" variant="outline">
                        {t("editProduct")}
                      </Button>
                    </Link>
                    {current === "APPROVED" ? (
                      <Button size="sm" variant="outline" onClick={() => setProductStatus(id, "DRAFT")}>
                        {t("unpublishProduct")}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setProductStatus(id, "APPROVED")}>
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
