"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";
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
  Plus,
  LayoutGrid,
  LogOut,
  RotateCcw,
} from "lucide-react";

interface NavItem {
  href: string;
  key: string;
  icon: React.ElementType;
  exact?: boolean;
}

const customerNav: NavItem[] = [
  { href: "/dashboard/customer", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/customer/orders", key: "orders", icon: ShoppingCart },
  { href: "/dashboard/customer/returns", key: "returns", icon: RotateCcw },
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

const adminPrimaryNav: NavItem[] = [
  { href: "/dashboard/admin", key: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/catalog", key: "products", icon: Package },
  { href: "/dashboard/admin/catalog/new", key: "addProduct", icon: Plus },
  { href: "/dashboard/admin/orders", key: "orders", icon: ShoppingCart },
  { href: "/dashboard/admin/returns", key: "productReturns", icon: RotateCcw },
  { href: "/dashboard/admin/categories", key: "categoriesNav", icon: LayoutGrid },
];

const adminMoreNav: NavItem[] = [
  { href: "/dashboard/admin/fraud", key: "fraud", icon: ShieldCheck },
  { href: "/dashboard/admin/users", key: "users", icon: Users },
  { href: "/dashboard/admin/sellers", key: "sellers", icon: Package },
  { href: "/dashboard/admin/products", key: "moderation", icon: Package },
  { href: "/dashboard/admin/marketing", key: "marketing", icon: Gift },
  { href: "/dashboard/admin/coupons", key: "coupons", icon: Ticket },
  { href: "/dashboard/admin/cod-network", key: "codNetwork", icon: BarChart3 },
  { href: "/dashboard/admin/support", key: "support", icon: MessageSquare },
  { href: "/dashboard/admin/audit-logs", key: "auditLogs", icon: Settings },
  { href: "/dashboard/admin/settings", key: "siteSettings", icon: Settings },
];

function isNavActive(pathname: string, href: string, locale: string, exact?: boolean) {
  const full = `/${locale}${href}`;
  if (exact || href === "/dashboard/admin") {
    return pathname === full || pathname === `${full}/`;
  }
  if (href === "/dashboard/admin/catalog") {
    if (pathname.startsWith(`/${locale}/dashboard/admin/catalog/new`)) return false;
    return pathname === full || pathname.startsWith(`${full}/`);
  }
  return pathname === full || pathname.startsWith(`${full}/`);
}

function NavLinks({
  items,
  locale,
  pathname,
  t,
}: {
  items: NavItem[];
  locale: string;
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <>
      {items.map((item) => {
        const href = `/${locale}${item.href}`;
        const isActive = isNavActive(pathname, item.href, locale, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              isActive || item.href === "/dashboard/admin/catalog/new"
                ? "bg-amber-500 text-slate-900"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(item.key)}
          </Link>
        );
      })}
    </>
  );
}

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
  const tc = useTranslations("common");
  const { logout } = useAuth();
  const nav = type === "admin" ? adminPrimaryNav : type === "seller" ? sellerNav : customerNav;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:gap-8">
      <aside className="lg:w-64 lg:shrink-0">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:sticky lg:top-24">
          {type === "admin" && (
            <p className="mb-3 px-2 text-xs font-semibold tracking-wide text-amber-400">
              {t("storeAdmin")}
            </p>
          )}
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:space-y-1 lg:overflow-visible">
            <NavLinks items={nav} locale={locale} pathname={pathname} t={t} />
            {type === "admin" && (
              <div className="mt-2 hidden border-t border-slate-800 pt-2 lg:block">
                <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("moreAdmin")}
                </p>
                <NavLinks items={adminMoreNav} locale={locale} pathname={pathname} t={t} />
              </div>
            )}
          </nav>
          {type === "admin" && (
            <button
              type="button"
              onClick={() => logout()}
              className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              {tc("logout")}
            </button>
          )}
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
