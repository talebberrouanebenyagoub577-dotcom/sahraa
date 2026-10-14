"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useCart } from "@/lib/context/CartContext";
import { Loader2 } from "lucide-react";

/**
 * Per CRO requirements: "لن تكون هناك Cart Page، فقط Cart Drawer."
 * Automatically opens the Cart Drawer and redirects to the home/catalog page.
 */
export default function CartPage() {
  const router = useRouter();
  const locale = useLocale();
  const { openCart } = useCart();

  useEffect(() => {
    openCart();
    router.replace(`/${locale}`);
  }, [router, locale, openCart]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      <p className="text-sm font-medium">جاري فتح سلة المشتريات...</p>
    </div>
  );
}
