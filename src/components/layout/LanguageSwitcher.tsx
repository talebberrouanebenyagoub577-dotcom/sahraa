"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  getOppositeLocale,
  LOCALE_STORAGE_KEY,
  switchLocalePath,
} from "@/lib/i18n/display";
import type { Locale } from "@/lib/constants";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (target: Locale) => {
    if (target === locale) return;
    localStorage.setItem(LOCALE_STORAGE_KEY, target);
    document.cookie = `NEXT_LOCALE=${target};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    const newPath = pathname.replace(`/${locale}`, `/${target}`);
    startTransition(() => router.push(newPath));
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-slate-600 bg-slate-800 p-0.5 text-xs font-semibold",
        isPending && "opacity-70",
        className
      )}
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => switchTo("ar")}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition-colors",
          locale === "ar"
            ? "bg-amber-500 text-slate-900"
            : "text-slate-300 hover:text-white"
        )}
        aria-pressed={locale === "ar"}
      >
        عربي
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition-colors",
          locale === "en"
            ? "bg-amber-500 text-slate-900"
            : "text-slate-300 hover:text-white"
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}

export function LanguageSwitcherLink({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const target = getOppositeLocale(locale);

  return (
    <a
      href={switchLocalePath(pathname, locale)}
      onClick={() => localStorage.setItem(LOCALE_STORAGE_KEY, target)}
      className={className}
    >
      {target === "ar" ? "عربي" : "EN"}
    </a>
  );
}
