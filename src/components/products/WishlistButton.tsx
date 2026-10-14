"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const locale = useLocale();
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setActive(false);
      return;
    }
    fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (typeof d?.data?.active === "boolean") {
          setActive(d.data.active);
        }
      })
      .catch(() => {});
  }, [productId, user]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (active) {
        const res = await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
        if (res.ok) { setActive(false); toast.success(t("removedFromWishlist")); }
        else if (res.status === 401) window.location.href = `/${locale}/auth/login`;
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) { setActive(true); toast.success(t("addedToWishlist")); }
        else if (res.status === 401) window.location.href = `/${locale}/auth/login`;
      }
    } catch {
      toast.error(tc("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={active ? t("removeFromWishlist") : t("addToWishlist")}
      aria-pressed={active}
      className={cn(
        "rounded-full border border-slate-200 bg-white/90 p-2.5 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        active && "text-red-500",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart className={cn("h-5 w-5", active && "fill-current")} />
      )}
    </button>
  );
}
