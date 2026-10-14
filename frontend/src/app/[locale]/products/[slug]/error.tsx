"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("product");

  return (
    <main className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-red-50 p-4 text-red-500">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-2xl font-bold">{t("productLoadError")}</h1>
      <p className="mt-2 text-slate-500">{t("productLoadErrorDescription")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          {t("tryAgain")}
        </Button>
        <Link href={`/${locale}/products`}>
          <Button variant="outline">{t("browseProducts")}</Button>
        </Link>
      </div>
    </main>
  );
}
