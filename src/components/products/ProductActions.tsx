"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus, Plus, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { AddToCartButton } from "./AddToCartButton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/context/CartContext";
import { quoteOfferTotals } from "@/lib/pricing";

interface Variant {
  id: string;
  name: string;
  nameAr?: string | null;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  price?: number | null;
  stock: number;
  image?: string | null;
  isActive: boolean;
}

interface ProductActionsProps {
  productId: string;
  variants: Variant[];
  inStock: boolean;
  inventoryQuantity: number;
  basePrice: number;
  compareAtPrice?: number | null;
}

export function ProductActions({
  productId,
  variants,
  inStock,
  inventoryQuantity,
  basePrice,
  compareAtPrice,
}: ProductActionsProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("product");
  const { refresh } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId),
    [selectedVariantId, variants]
  );
  const requiresVariant = variants.length > 0;
  const selectedPrice = selectedVariant?.price ?? basePrice;
  const availableStock = selectedVariant
    ? Math.min(selectedVariant.stock, inventoryQuantity)
    : inventoryQuantity;
  const canPurchase =
    inStock &&
    availableStock > 0 &&
    (!requiresVariant || Boolean(selectedVariant));
  const quantityOffer = useMemo(
    () => quoteOfferTotals(selectedPrice * quantity, quantity),
    [quantity, selectedPrice]
  );

  const selectVariant = (variant: Variant) => {
    if (variant.stock < 1) return;
    setSelectedVariantId(variant.id);
    setQuantity(1);
  };

  const validateSelection = () => {
    if (requiresVariant && !selectedVariant) {
      toast.error(t("selectVariantRequired"));
      return false;
    }
    return true;
  };

  const buyNow = async () => {
    if (!validateSelection() || buying) return;
    setBuying(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: selectedVariantId,
          quantity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await refresh();
        router.push(`/${locale}/checkout`);
      } else if (res.status === 401) {
        toast.error(t("loginFirst"));
        router.push(`/${locale}/auth/login`);
      } else {
        toast.error(data.error || t("purchaseFailed"));
      }
    } catch {
      toast.error(t("purchaseFailed"));
    } finally {
      setBuying(false);
    }
  };

  const actions = (mobile = false) => (
    <div className={cn("flex gap-2", mobile ? "w-full" : "mt-5")}>
      <AddToCartButton
        productId={productId}
        variantId={selectedVariantId}
        quantity={quantity}
        size="lg"
        className="min-w-0 flex-1"
        disabled={!canPurchase}
        onError={() => undefined}
      />
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="min-w-0 flex-1 border-amber-500 text-amber-600 hover:bg-amber-50"
        onClick={buyNow}
        disabled={!canPurchase || buying}
        aria-busy={buying}
      >
        {buying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {t("buyNow")}
      </Button>
    </div>
  );

  return (
    <div>
      {variants.length > 0 && (
        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-semibold">
            {t("selectVariant")}
            <span className="ms-1 text-red-500" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {variants.map((variant) => {
              const active = selectedVariantId === variant.id;
              const unavailable = variant.stock < 1;
              const label =
                locale === "ar" ? variant.nameAr || variant.name : variant.name;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant)}
                  disabled={unavailable}
                  aria-pressed={active}
                  className={cn(
                    "relative flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-start text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                    active
                      ? "border-amber-500 bg-amber-50 text-slate-950"
                      : "border-slate-200 hover:border-amber-400",
                    unavailable && "cursor-not-allowed opacity-45"
                  )}
                >
                  {variant.colorHex && (
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-black/15"
                      style={{ backgroundColor: variant.colorHex }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{label}</span>
                    {(variant.size || variant.color) && (
                      <span className="block truncate text-xs text-slate-500">
                        {[variant.color, variant.size].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {variant.price != null && (
                      <span className="block text-xs font-semibold text-amber-600">
                        {formatPrice(variant.price, "SAR", locale)}
                      </span>
                    )}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-amber-600" />}
                  {unavailable && (
                    <span className="absolute inset-x-1 top-1/2 h-px -rotate-6 bg-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
          {!selectedVariant && (
            <p className="mt-2 text-xs text-slate-500">
              {t("selectVariantBeforeCart")}
            </p>
          )}
        </fieldset>
      )}

      {selectedVariant && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">{t("selectedPrice")}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">
              {formatPrice(selectedPrice, "SAR", locale)}
            </span>
            {compareAtPrice && compareAtPrice > selectedPrice && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(compareAtPrice, "SAR", locale)}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-4">
        <label htmlFor={`quantity-${productId}`} className="text-sm font-semibold">
          {t("quantity")}
        </label>
        <div className="flex items-center rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="p-2.5 disabled:opacity-40"
            aria-label={t("decreaseQuantity")}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            id={`quantity-${productId}`}
            type="number"
            min={1}
            max={Math.max(1, availableStock)}
            value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              setQuantity(
                Math.max(1, Math.min(availableStock || 1, Number.isFinite(value) ? value : 1))
              );
            }}
            className="w-12 border-x border-slate-200 bg-transparent py-2 text-center text-sm font-semibold outline-none"
          />
          <button
            type="button"
            onClick={() =>
              setQuantity((value) => Math.min(availableStock, value + 1))
            }
            disabled={!canPurchase || quantity >= availableStock}
            className="p-2.5 disabled:opacity-40"
            aria-label={t("increaseQuantity")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-amber-800">{t("offerBody")}</p>
      {quantityOffer.discount > 0 && (
        <p className="mt-1 text-sm font-semibold text-emerald-700">
          {formatPrice(quantityOffer.total, "SAR", locale)}
        </p>
      )}

      {availableStock > 0 && availableStock <= 5 && (
        <p className="mt-2 text-sm font-semibold text-orange-500">
          {t("onlyUnitsLeft", { count: availableStock })}
        </p>
      )}

      {actions()}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-slate-950/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="shrink-0">
            <p className="text-xs text-slate-400">{t("price")}</p>
            <p className="font-bold text-white">
              {formatPrice(quantityOffer.total, "SAR", locale)}
            </p>
          </div>
          {actions(true)}
        </div>
      </div>
    </div>
  );
}
