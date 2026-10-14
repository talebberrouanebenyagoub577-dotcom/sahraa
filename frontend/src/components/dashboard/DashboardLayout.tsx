"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Warehouse,
  Ticket,
  Gift,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  key: string;
  icon: React.ElementType;
}

const customerNav: NavItem[] = [
  { href: "/dashboard/customer", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/customer/orders", key: "orders", icon: ShoppingCart },
  { href: "/dashboard/customer/addresses", key: "addresses", icon: Package },
  { href: "/dashboard/customer/wishlist", key: "wishlist", icon: Gift },
  { href: "/dashboard/customer/support", key: "support", icon: MessageSquare },
  { href: "/dashboard/customer/settings", key: "settings", icon: Settings },
];

const sellerNav: NavItem[] = [
  { href: "/dashboard/seller", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/seller/products", key: "products", icon: Package },
  { href: "/dashboard/seller/inventory", key: "inventory", icon: Warehouse },
  { href: "/dashboard/seller/orders", key: "orders", icon: ShoppingCart },
  { href: "/dashboard/seller/analytics", key: "analytics", icon: BarChart3 },
  { href: "/dashboard/seller/withdrawals", key: "withdrawals", icon: Gift },
];

const adminNav: NavItem[] = [
  { href: "/dashboard/admin", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/orders", key: "orders", icon: ShoppingCart },
  { href: "/dashboard/admin/fraud", key: "fraud", icon: ShieldCheck },
  { href: "/dashboard/admin/users", key: "users", icon: Users },
  { href: "/dashboard/admin/sellers", key: "sellers", icon: Package },
  { href: "/dashboard/admin/catalog", key: "adminCatalog", icon: Package },
  { href: "/dashboard/admin/products", key: "moderation", icon: Package },
  { href: "/dashboard/admin/marketing", key: "marketing", icon: Gift },
  { href: "/dashboard/admin/coupons", key: "coupons", icon: Ticket },
  { href: "/dashboard/admin/cod-network", key: "codNetwork", icon: BarChart3 },
  { href: "/dashboard/admin/support", key: "support", icon: MessageSquare },
  { href: "/dashboard/admin/audit-logs", key: "auditLogs", icon: Settings },
  { href: "/dashboard/admin/settings", key: "siteSettings", icon: Settings },
];

export function DashboardLayout({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "customer" | "seller" | "admin";
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const nav = type === "admin" ? adminNav : type === "seller" ? sellerNav : customerNav;

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <nav className="sticky top-24 space-y-1">
          {nav.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = pathname.startsWith(href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
