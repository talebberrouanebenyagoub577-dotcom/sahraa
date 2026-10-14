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
  productDetails?: {
    id: string;
    name: string;
    nameAr?: string | null;
    slug: string;
    image?: string;
    price?: number;
  };
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
  productDetails,
  onSuccess,
  onError,
}: AddToCartButtonProps) {
  const { addItem, openCart } = useCart();
  const locale = useLocale();
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      if (productDetails) {
        addItem(productDetails, variantId, quantity, true);
        toast.success(t("addedToCart"));
        onSuccess?.();
      } else {
        // Fetch product basic info if not provided
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.data;
          addItem(
            {
              id: p.id,
              name: p.name,
              nameAr: p.nameAr,
              slug: p.slug,
              image: p.images?.[0]?.url || "/placeholder.png",
              price: p.price,
            },
            variantId,
            quantity,
            true
          );
          toast.success(t("addedToCart"));
          onSuccess?.();
        } else {
          // Fallback to basic stub so item is added anyway
          addItem(
            {
              id: productId,
              name: "منتج صحرا",
              nameAr: "منتج صحرا",
              slug: productId,
              image: "/placeholder.png",
            },
            variantId,
            quantity,
            true
          );
          toast.success(t("addedToCart"));
          onSuccess?.();
        }
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
      disabled={disabled || loading}
      onClick={handleAdd}
      aria-busy={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      {label || t("addToCart")}
    </Button>
  );
}
