"use client";



import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";



export default function AdminSupportPage() {

  const t = useTranslations("dashboard");

  const [tickets, setTickets] = useState([]);



  const load = () => {

    apiFetch("/api/support/tickets")

      .then((r) => r.json())

      .then((d) => setTickets(d.data || []));

  };



  useEffect(() => { load(); }, []);



  const updateStatus = async (ticketId: string, status: string) => {

    await apiFetch("/api/support/tickets", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ ticketId, status }),

    });

    load();

  };



  return (

    <DashboardLayout type="admin">

      <h1 className="mb-6 text-2xl font-bold">{t("supportTickets")}</h1>

      <DataTable

        data={tickets}

        columns={[

          { key: "ticketNumber", label: "#" },

          { key: "subject", label: t("colSubject") },

          { key: "status", label: t("colStatus"), render: (r) => <Badge>{String(r.status)}</Badge> },

          { key: "priority", label: t("colPriority") },

          { key: "user", label: t("colCustomer"), render: (r) => `${(r.user as { firstName: string })?.firstName} ${(r.user as { lastName: string })?.lastName}` },

          { key: "actions", label: "", render: (r) => (

            <Button size="sm" onClick={() => updateStatus(String(r.id), "RESOLVED")}>{t("resolve")}</Button>

          )},

        ]}

      />

    </DashboardLayout>

  );

}


