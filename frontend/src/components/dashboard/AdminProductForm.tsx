"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { PRODUCT_UNIT_PRICE } from "@/lib/pricing";

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
  imageLines: string;
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
  quantity: 0,
  codAvailable: true,
  status: "APPROVED",
  imageLines: "",
};

function parseImages(lines: string) {
  return lines
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((url) => ({ url }));
}

export function AdminProductForm({
  initial,
  productId,
  onSuccess,
}: {
  initial?: Partial<AdminProductFormValues>;
  productId?: string;
  onSuccess: () => void;
}) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<AdminProductFormValues>({ ...emptyForm, ...initial });

  const imageUrls = parseImages(form.imageLines);

  const appendImageUrl = (url: string) => {
    setForm((prev) => ({
      ...prev,
      imageLines: prev.imageLines.trim()
        ? `${prev.imageLines.trim()}\n${url}`
        : url,
    }));
  };

  const removeImageUrl = (url: string) => {
    setForm((prev) => ({
      ...prev,
      imageLines: prev.imageLines
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && l !== url)
        .join("\n"),
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
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        appendImageUrl(data.data.url);
        ok++;
      } else {
        toast.error(data.error || t("uploadFailed"));
      }
    }
    if (ok > 0) toast.success(t("fileUploaded"));
    setUploading(false);
  };

  useEffect(() => {
    apiFetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const images = parseImages(form.imageLines);
    const payload = {
      name: form.name,
      nameAr: form.nameAr,
      description: form.description,
      descriptionAr: form.descriptionAr,
      categoryId: form.categoryId,
      price: Number(form.price),
      compareAtPrice:
        form.compareAtPrice === "" ? undefined : Number(form.compareAtPrice),
      sku: form.sku,
      quantity: Number(form.quantity),
      codAvailable: form.codAvailable,
      status: form.status,
      images: images.length ? images : undefined,
    };

    const url = productId
      ? `/api/admin/catalog/products/${productId}`
      : "/api/admin/catalog/products";
    const method = productId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const d = await res.json();
      alert(d.error || "Error");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border bg-white p-6">
      <Input
        placeholder={t("nameEn")}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        placeholder={t("nameAr")}
        value={form.nameAr}
        onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
        required
      />
      <textarea
        className="w-full rounded-lg border p-3 text-sm"
        rows={3}
        placeholder={t("description")}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
      />
      <textarea
        className="w-full rounded-lg border p-3 text-sm"
        rows={3}
        placeholder={t("descriptionAr")}
        value={form.descriptionAr}
        onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
        required
      />
      <select
        className="w-full rounded-lg border p-2"
        value={form.categoryId}
        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        required
      >
        <option value="">{t("selectCategory")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          step="0.01"
          placeholder={t("colPrice")}
          value={form.price || ""}
          onChange={(e) => setForm({ ...form, price: +e.target.value })}
          required
        />
        <Input
          type="number"
          step="0.01"
          placeholder={t("compareAtPrice")}
          value={form.compareAtPrice}
          onChange={(e) =>
            setForm({
              ...form,
              compareAtPrice: e.target.value === "" ? "" : +e.target.value,
            })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          required
        />
        <Input
          type="number"
          placeholder={t("quantity")}
          value={form.quantity || ""}
          onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
          required
        />
      </div>
      <select
        className="w-full rounded-lg border p-2"
        value={form.status}
        onChange={(e) =>
          setForm({
            ...form,
            status: e.target.value as AdminProductFormValues["status"],
          })
        }
      >
        <option value="APPROVED">{t("statusApproved")}</option>
        <option value="DRAFT">{t("statusDraft")}</option>
        <option value="ARCHIVED">{t("statusArchived")}</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.codAvailable}
          onChange={(e) => setForm({ ...form, codAvailable: e.target.checked })}
        />
        {t("codAvailable")}
      </label>
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
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imageUrls.map(({ url }) => (
              <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white"
                  onClick={() => removeImageUrl(url)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <details className="text-sm text-slate-500">
          <summary className="cursor-pointer">{t("imageUrlsHint")}</summary>
          <textarea
            className="mt-2 w-full rounded-lg border p-3 font-mono text-xs"
            rows={3}
            value={form.imageLines}
            onChange={(e) => setForm({ ...form, imageLines: e.target.value })}
          />
        </details>
      </div>
      <Button type="submit" disabled={loading}>
        {productId ? tc("save") : tc("create")}
      </Button>
    </form>
  );
}
