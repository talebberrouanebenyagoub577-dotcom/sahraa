"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";

export default function CustomerNotificationsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [notifications, setNotifications] = useState([]);

  const load = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.data?.notifications || []));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  };

  return (
    <DashboardLayout type="customer">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isRtl ? "الإشعارات" : "Notifications"}</h1>
        <Button variant="outline" size="sm" onClick={markAllRead}>{isRtl ? "قراءة الكل" : "Mark all read"}</Button>
      </div>
      <div className="space-y-3">
        {notifications.map((n: { id: string; title: string; titleAr: string; message: string; messageAr: string; isRead: boolean; createdAt: string }) => (
          <div key={n.id} className={`rounded-xl border bg-white p-4 ${!n.isRead ? "border-amber-200 bg-amber-50" : ""}`}>
            <p className="font-medium">{isRtl ? n.titleAr || n.title : n.title}</p>
            <p className="mt-1 text-sm text-slate-600">{isRtl ? n.messageAr || n.message : n.message}</p>
            <p className="mt-2 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-slate-500">{isRtl ? "لا توجد إشعارات" : "No notifications"}</p>}
      </div>
    </DashboardLayout>
  );
}
