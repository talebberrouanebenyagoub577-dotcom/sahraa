"use client";

import { apiFetch } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";
import toast from "react-hot-toast";
import { PRODUCT_UNIT_PRICE } from "@/lib/pricing";
import { catalogErrorMessage } from "@/lib/admin/catalog-error";

type CatalogImage = { url: string; isPrimary: boolean };

export type AdminProductFormValues = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string;
  price: number;
  compareAtPrice: number | "";
  sku: string;
  quantity: number;
  codAvailable: boolean;
  status: "APPROVED" | "DRAFT" | "ARCHIVED";
  images: CatalogImage[];
};

const emptyForm: AdminProductFormValues = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  categoryId: "",
  price: PRODUCT_UNIT_PRICE,
  compareAtPrice: "",
  sku: "",
  quantity: 10,
  codAvailable: true,
  status: "APPROVED",
  images: [],
};

export function AdminProductForm({
  initial,
  productId,
  onSuccess,
}: {
  initial?: Partial<AdminProductFormValues>;
  productId?: string;
  onSuccess: () => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [categories, setCategories] = useState<{ id: string; name: string; nameAr: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<AdminProductFormValues>({ ...emptyForm, ...initial });

  const setField = <K extends keyof AdminProductFormValues>(key: K, value: AdminProductFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const appendImage = (url: string) => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url, isPrimary: prev.images.length === 0 }],
    }));
  };

  const removeImage = (url: string) => {
    setForm((prev) => {
      const images = prev.images.filter((image) => image.url !== url);
      if (images.length && !images.some((image) => image.isPrimary)) {
        images[0] = { ...images[0], isPrimary: true };
      }
      return { ...prev, images };
    });
  };

  const setPrimary = (url: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((image) => ({ ...image, isPrimary: image.url === url })),
    }));
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await apiFetch("/api/admin/catalog/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        appendImage(data.data.url);
        ok++;
      } else {
        toast.error(data.error || t("uploadFailed"));
      }
    }
    if (ok > 0) toast.success(t("fileUploaded"));
    setUploading(false);
  };

  useEffect(() => {
    apiFetch("/api/admin/catalog/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error(t("needCategory"));
      return;
    }
    setLoading(true);
    const payload = {
      name: form.name,
      nameAr: form.nameAr,
      description: form.description,
      descriptionAr: form.descriptionAr,
      categoryId: form.categoryId,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === "" ? undefined : Number(form.compareAtPrice),
      sku: form.sku.trim(),
      quantity: Number(form.quantity),
      codAvailable: form.codAvailable,
      status: form.status,
      images: form.images.length ? form.images : undefined,
    };

    const url = productId
      ? `/api/admin/catalog/products/${productId}`
      : "/api/admin/catalog/products";
    const method = productId ? "PATCH" : "POST";

    try {
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        onSuccess();
        return;
      }
      toast.error(catalogErrorMessage(d, t("skuExists"), tc("error")));
    } catch {
      toast.error(tc("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {categories.length === 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("needCategory")}{" "}
          <Link href={`/${locale}/dashboard/admin/categories`} className="font-bold underline">
            {t("categoriesNav")}
          </Link>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t("nameAr")}
          <Input className="mt-1" value={form.nameAr} onChange={(e) => setField("nameAr", e.target.value)} required minLength={3} dir="rtl" />
        </label>
        <label className="block text-sm font-medium">
          {t("nameEn")}
          <Input className="mt-1" value={form.name} onChange={(e) => setField("name", e.target.value)} required minLength={3} dir="ltr" />
        </label>
      </div>

      <label className="block text-sm font-medium">
        {t("descriptionAr")}
        <textarea
          className="mt-1 w-full rounded-lg border p-3 text-sm"
          rows={4}
          value={form.descriptionAr}
          onChange={(e) => setField("descriptionAr", e.target.value)}
          required
          minLength={3}
          dir="rtl"
        />
      </label>
      <label className="block text-sm font-medium">
        {t("description")}
        <textarea
          className="mt-1 w-full rounded-lg border p-3 text-sm"
          rows={4}
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          required
          minLength={3}
          dir="ltr"
        />
      </label>

      <label className="block text-sm font-medium">
        {t("selectCategory")}
        <select
          className="mt-1 w-full rounded-lg border p-2"
          value={form.categoryId}
          onChange={(e) => setField("categoryId", e.target.value)}
          required
        >
          <option value="">{t("selectCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getLocalizedName(category, locale)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t("colPrice")}
          <Input
            className="mt-1"
            type="number"
            step="0.01"
            value={form.price || ""}
            onChange={(e) => setField("price", +e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          {t("compareAtPrice")}
          <Input
            className="mt-1"
            type="number"
            step="0.01"
            value={form.compareAtPrice}
            onChange={(e) => setField("compareAtPrice", e.target.value === "" ? "" : +e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          SKU
          <Input className="mt-1" value={form.sku} onChange={(e) => setField("sku", e.target.value)} required minLength={3} dir="ltr" />
        </label>
        <label className="block text-sm font-medium">
          {t("quantity")}
          <Input
            className="mt-1"
            type="number"
            value={form.quantity || ""}
            onChange={(e) => setField("quantity", +e.target.value)}
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {tc("status")}
          <select
            className="mt-1 w-full rounded-lg border p-2"
            value={form.status}
            onChange={(e) => setField("status", e.target.value as AdminProductFormValues["status"])}
          >
            <option value="APPROVED">{t("statusApproved")}</option>
            <option value="DRAFT">{t("statusDraft")}</option>
            <option value="ARCHIVED">{t("statusArchived")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.codAvailable}
            onChange={(e) => setField("codAvailable", e.target.checked)}
          />
          {t("codAvailable")}
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">{t("productPhotos")}</p>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center hover:border-amber-400">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="text-sm text-slate-600">
            {uploading ? t("uploadingPhotos") : t("uploadPhotosHint")}
          </span>
          <span className="mt-1 text-xs text-slate-400">PNG, JPG, WebP — 5MB</span>
        </label>
        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {form.images.map((image) => (
              <div key={image.url} className="relative h-28 w-28 overflow-hidden rounded-lg border">
                <Image src={mediaUrl(image.url)} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  className="absolute end-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white"
                  onClick={() => removeImage(image.url)}
                >
                  ×
                </button>
                <button
                  type="button"
                  className={`absolute inset-x-1 bottom-1 rounded px-1 py-0.5 text-[10px] ${
                    image.isPrimary ? "bg-amber-500 text-white" : "bg-black/60 text-white"
                  }`}
                  onClick={() => setPrimary(image.url)}
                >
                  {image.isPrimary ? t("primaryImage") : t("setPrimaryImage")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading || uploading}>
        {productId ? tc("save") : tc("create")}
      </Button>
    </form>
  );
}
