"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import toast from "react-hot-toast";

export default function CustomerSettingsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user, refresh, logout } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, phone: "" });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { refresh(); toast.success(isRtl ? "تم الحفظ" : "Saved"); }
  };

  return (
    <DashboardLayout type="customer">
      <h1 className="mb-6 text-2xl font-bold">{isRtl ? "الإعدادات" : "Settings"}</h1>
      <form onSubmit={save} className="max-w-md space-y-4 rounded-xl border bg-white p-6">
        <Input placeholder={isRtl ? "الاسم الأول" : "First Name"} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <Input placeholder={isRtl ? "اسم العائلة" : "Last Name"} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <Input placeholder={isRtl ? "الجوال" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit">{isRtl ? "حفظ" : "Save"}</Button>
      </form>
      <Button variant="destructive" className="mt-6" onClick={logout}>{isRtl ? "تسجيل الخروج" : "Logout"}</Button>
    </DashboardLayout>
  );
}
