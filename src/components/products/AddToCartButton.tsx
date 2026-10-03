"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/context/CartContext";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  quantity?: number;
  className?: string;
  size?: "default" | "sm" | "lg";
  label?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  className,
  size = "default",
  label,
  disabled = false,
  onSuccess,
  onError,
}: AddToCartButtonProps) {
  const { refresh } = useCart();
  const locale = useLocale();
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        await refresh();
        toast.success(t("addedToCart"));
        onSuccess?.();
      } else if (res.status === 401) {
        toast.error(t("loginFirst"));
        window.location.href = `/${locale}/auth/login`;
      } else {
        const message = data.error || tc("error");
        toast.error(message);
        onError?.(message);
      }
    } catch {
      toast.error(tc("error"));
      onError?.(tc("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={handleAdd}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      {loading ? t("addingToCart") : label || t("addToCart")}
    </Button>
  );
}
