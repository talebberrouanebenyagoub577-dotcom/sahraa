"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import toast from "react-hot-toast";



export default function AdminUsersPage() {

  const t = useTranslations("dashboard");

  const tc = useTranslations("common");

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);



  const load = () => {

    apiFetch("/api/admin/users")

      .then((r) => r.json())

      .then((d) => setUsers(d.data?.users || []))

      .finally(() => setLoading(false));

  };



  useEffect(() => { load(); }, []);



  const toggleActive = async (userId: string, isActive: boolean) => {

    await apiFetch("/api/admin/users", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ userId, isActive: !isActive }),

    });

    load();

    toast.success(t("updated"));

  };



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("userManagement")}</h1>

      <DataTable

        loading={loading}

        data={users}

        columns={[

          { key: "email", label: tc("email") },

          { key: "name", label: t("colName"), render: (r) => `${r.firstName} ${r.lastName}` },

          { key: "role", label: t("colRole"), render: (r) => <Badge>{String(r.role)}</Badge> },

          { key: "isActive", label: t("colStatus"), render: (r) => <Badge variant={r.isActive ? "success" : "danger"}>{r.isActive ? tc("active") : tc("inactive")}</Badge> },

          { key: "actions", label: "", render: (r) => (

            <Button size="sm" variant="outline" onClick={() => toggleActive(String(r.id), Boolean(r.isActive))}>

              {r.isActive ? t("deactivate") : t("activate")}

            </Button>

          )},

        ]}

      />

    </DashboardLayout>

  );

}


