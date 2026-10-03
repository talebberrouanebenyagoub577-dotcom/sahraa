"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search, ShoppingCart, Heart, Bell, User, Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import { SiteLogo } from "@/components/settings/SiteLogo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { getLocalizedName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";

export function Header() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("common");
  const th = useTranslations("header");
  const router = useRouter();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ slug: string; name: string; nameAr: string }[]>([]);
  const [unread, setUnread] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories((d.data || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications?unread=true")
        .then((r) => r.json())
        .then((d) => setUnread(d.data?.unreadCount || 0))
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = (q: string) => {
    if (q.length >= 2) router.push(`/${locale}/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearchInput = async (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}&type=suggest`);
        const data = await res.json();
        setSuggestions(data.data?.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    } else setSuggestions([]);
  };

  const dashboardLink = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN"
    ? `/${locale}/dashboard/admin`
    : user?.role === "SELLER"
      ? `/${locale}/dashboard/seller`
      : `/${locale}/dashboard/customer`;

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
      <div className="bg-amber-500 py-1 text-center text-xs font-medium text-slate-900">
        {th("promoBanner")}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}`}>
            <SiteLogo nameClassName="hidden text-xl font-bold tracking-tight text-white sm:block" />
          </Link>

          <div className="relative flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                placeholder={t("search")}
                className="h-11 border-0 bg-slate-800 ps-10 text-slate-100 shadow-inner placeholder:text-slate-400"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 py-2 shadow-xl">
                {suggestions.map((s) => (
                  <button key={s} className="w-full px-4 py-2 text-start text-sm text-slate-200 hover:bg-slate-800" onClick={() => handleSearch(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />

            <Link href={`/${locale}/wishlist`} className="rounded-lg p-2 hover:bg-slate-800" title={t("wishlist")}>
              <Heart className="h-5 w-5" />
            </Link>

            {user && (
              <Link href={`/${locale}/dashboard/customer/notifications`} className="relative rounded-lg p-2 hover:bg-slate-800" title={t("notifications")}>
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">{unread}</span>
                )}
              </Link>
            )}

            <Link href={`/${locale}/cart`} className="relative rounded-lg p-2 hover:bg-slate-800" title={t("cart")}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-900">{count}</span>
              )}
            </Link>

            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="rounded-lg p-2 hover:bg-slate-800" aria-label={t("account")}>
                <User className="h-5 w-5" />
              </button>
              {showUserMenu && (
                <div className="absolute end-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-900 py-2 text-slate-200 shadow-xl">
                  {user ? (
                    <>
                      <p className="border-b border-slate-700 px-4 py-2 text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <Link href={dashboardLink} className="block px-4 py-2 text-sm hover:bg-slate-800" onClick={() => setShowUserMenu(false)}>
                        {t("account")}
                      </Link>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800">
                        <LogOut className="h-4 w-4" />{t("logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href={`/${locale}/auth/login`} className="block px-4 py-2 text-sm hover:bg-slate-800">{t("login")}</Link>
                      <Link href={`/${locale}/auth/register`} className="block px-4 py-2 text-sm hover:bg-slate-800">{t("register")}</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="border-t border-slate-700 bg-slate-800">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2 text-sm">
          <span className="flex shrink-0 items-center gap-2 font-medium">
            <Menu className="h-4 w-4" />{t("categories")}
          </span>
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/${locale}/categories/${cat.slug}`} className="shrink-0 whitespace-nowrap hover:text-amber-400">
              {getLocalizedName(cat, locale)}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
