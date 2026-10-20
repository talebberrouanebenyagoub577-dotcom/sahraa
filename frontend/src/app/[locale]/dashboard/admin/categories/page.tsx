"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";
import toast from "react-hot-toast";

type CategoryRow = {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
  _count?: { products: number };
};

export default function AdminCategoriesPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nameAr: "", name: "" });

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/api/admin/catalog/categories")
      .then((r) => r.json())
      .then((d) => setRows(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/api/admin/catalog/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(t("categoryCreated"));
      setForm({ nameAr: "", name: "" });
      load();
    } else toast.error((await res.json()).error);
  };

  const toggle = async (row: CategoryRow) => {
    const res = await apiFetch(`/api/admin/catalog/categories/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    if (res.ok) {
      toast.success(t("updated"));
      load();
    } else toast.error((await res.json()).error);
  };

  return (
    <DashboardLayout type="admin">
      <h1 className="text-2xl font-bold">{t("categoriesNav")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("categoriesSubtitle")}</p>

      <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-3">
        <Input
          value={form.nameAr}
          onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          placeholder={t("nameAr")}
          required
        />
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("nameEn")}
          required
        />
        <Button type="submit">{tc("create")}</Button>
      </form>

      <div className="mt-6">
        <DataTable
          loading={loading}
          data={rows as unknown as Record<string, unknown>[]}
          emptyMessage={t("noCategories")}
          columns={[
            {
              key: "name",
              label: t("colName"),
              render: (r) => getLocalizedName(r as { name: string; nameAr: string }, locale),
            },
            { key: "slug", label: "slug", render: (r) => String(r.slug) },
            {
              key: "products",
              label: t("products"),
              render: (r) => String((r._count as { products: number } | undefined)?.products ?? 0),
            },
            {
              key: "status",
              label: t("colStatus"),
              render: (r) => <Badge>{r.isActive ? tc("active") : tc("inactive")}</Badge>,
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <Button size="sm" variant="outline" onClick={() => toggle(r as unknown as CategoryRow)}>
                  {r.isActive ? t("deactivate") : t("activate")}
                </Button>
              ),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
