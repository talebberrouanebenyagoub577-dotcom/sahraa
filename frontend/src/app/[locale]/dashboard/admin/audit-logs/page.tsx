"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";



export default function AdminAuditLogsPage() {

  const t = useTranslations("dashboard");

  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);



  useEffect(() => {

    apiFetch("/api/admin/audit-logs")

      .then((r) => r.json())

      .then((d) => setLogs(d.data?.logs || []));

  }, []);



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("auditLogs")}</h1>

      <DataTable

        data={logs}

        columns={[

          { key: "action", label: t("colAction") },

          { key: "entity", label: t("colEntity") },

          { key: "user", label: t("colUser"), render: (r) => r.user ? `${(r.user as { firstName: string }).firstName}` : t("system") },

          { key: "createdAt", label: t("colDate"), render: (r) => new Date(String(r.createdAt)).toLocaleString() },

        ]}

      />

    </DashboardLayout>

  );

}


