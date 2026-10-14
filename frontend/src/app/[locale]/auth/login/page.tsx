"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(tc("success"));
        const role = data.data?.user?.role;
        const dest = role === "SUPER_ADMIN" || role === "ADMIN"
          ? `/${locale}/dashboard/admin`
          : role === "SELLER"
            ? `/${locale}/dashboard/seller`
            : `/${locale}/dashboard/customer`;
        router.push(dest);
      } else {
        toast.error(data.error || tc("error"));
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-2xl font-bold text-slate-900">
            س
          </div>
          <h1 className="text-2xl font-bold">{tc("login")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("email")}</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("password")}</label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {tc("login")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t("noAccount")}{" "}
          <Link href={`/${locale}/auth/register`} className="font-medium text-amber-400">
            {tc("register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
