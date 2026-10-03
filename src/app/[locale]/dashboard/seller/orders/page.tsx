"use client";



import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

import { DataTable } from "@/components/dashboard/DataTable";

import { Badge } from "@/components/ui/badge";

import { formatPrice } from "@/lib/utils";



export default function SellerOrdersPage() {

  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [orders, setOrders] = useState([]);



  useEffect(() => {

    fetch("/api/seller/orders")

      .then((r) => r.json())

      .then((d) => setOrders(d.data || []));

  }, []);



  return (

    <DashboardLayout type="seller">

      <h1 className="mb-6 text-2xl font-bold">{t("storeOrders")}</h1>

      <DataTable

        data={orders}

        columns={[

          { key: "order", label: t("colOrderNumber"), render: (r) => String((r.order as { orderNumber: string })?.orderNumber) },

          { key: "name", label: t("colProduct") },

          { key: "quantity", label: t("colQty") },

          { key: "total", label: t("colTotal"), render: (r) => formatPrice(Number(r.total), "SAR", locale) },

          { key: "status", label: t("colStatus"), render: (r) => <Badge>{String((r.order as { status: string })?.status)}</Badge> },

          { key: "customer", label: t("colCustomer"), render: (r) => `${(r.order as { user: { firstName: string; lastName: string } })?.user?.firstName} ${(r.order as { user: { lastName: string } })?.user?.lastName}` },

        ]}

      />

    </DashboardLayout>

  );

}


