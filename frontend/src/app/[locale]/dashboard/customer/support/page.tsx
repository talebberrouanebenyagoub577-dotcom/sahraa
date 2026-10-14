"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function CustomerSupportPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: "", message: "" });

  const load = () => {
    apiFetch("/api/support/tickets")
      .then((r) => r.json())
      .then((d) => setTickets(d.data || []));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { load(); setForm({ subject: "", message: "" }); toast.success(isRtl ? "تم إرسال التذكرة" : "Ticket submitted"); }
  };

  return (
    <DashboardLayout type="customer">
      <h1 className="mb-6 text-2xl font-bold">{isRtl ? "الدعم الفني" : "Support"}</h1>
      <form onSubmit={submit} className="mb-6 space-y-3 rounded-xl border bg-white p-6">
        <Input placeholder={isRtl ? "الموضوع" : "Subject"} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        <textarea className="w-full rounded-lg border p-3 text-sm" rows={4} placeholder={isRtl ? "الرسالة" : "Message"} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        <Button type="submit">{isRtl ? "إرسال" : "Submit"}</Button>
      </form>
      <DataTable
        data={tickets}
        columns={[
          { key: "ticketNumber", label: "#" },
          { key: "subject", label: isRtl ? "الموضوع" : "Subject" },
          { key: "status", label: isRtl ? "الحالة" : "Status", render: (r) => <Badge>{String(r.status)}</Badge> },
          { key: "createdAt", label: isRtl ? "التاريخ" : "Date", render: (r) => new Date(String(r.createdAt)).toLocaleDateString() },
        ]}
      />
    </DashboardLayout>
  );
}
