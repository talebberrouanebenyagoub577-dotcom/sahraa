"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

export default function CustomerAddressesPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    label: "Home", firstName: "", lastName: "", phone: "", street: "", city: "", country: "SA",
  });

  const load = () => {
    fetch("/api/addresses").then((r) => r.json()).then((d) => setAddresses(d.data || []));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { load(); toast.success(isRtl ? "تمت الإضافة" : "Address added"); }
  };

  const remove = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <DashboardLayout type="customer">
      <h1 className="mb-6 text-2xl font-bold">{isRtl ? "عناويني" : "My Addresses"}</h1>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {addresses.map((addr: { id: string; label: string; street: string; city: string; isDefault: boolean }) => (
          <div key={addr.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{addr.label}</span>
              {addr.isDefault && <Badge variant="success">Default</Badge>}
            </div>
            <p className="mt-2 text-sm text-slate-600">{addr.street}, {addr.city}</p>
            <Button size="sm" variant="destructive" className="mt-3" onClick={() => remove(addr.id)}>{isRtl ? "حذف" : "Delete"}</Button>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="max-w-lg space-y-3 rounded-xl border bg-white p-6">
        <h3 className="font-bold">{isRtl ? "إضافة عنوان" : "Add Address"}</h3>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder={isRtl ? "الاسم الأول" : "First Name"} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Input placeholder={isRtl ? "اسم العائلة" : "Last Name"} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </div>
        <Input placeholder={isRtl ? "الجوال" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <Input placeholder={isRtl ? "الشارع" : "Street"} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
        <Input placeholder={isRtl ? "المدينة" : "City"} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        <Button type="submit">{isRtl ? "حفظ" : "Save"}</Button>
      </form>
    </DashboardLayout>
  );
}
