"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Minus, Plus, Zap, ShieldCheck, Truck } from "lucide-react";
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

interface ProductInfo {
  name: string;
  nameAr?: string | null;
  slug: string;
  image?: string;
}

interface ProductActionsProps {
  productId: string;
  productInfo?: ProductInfo;
  variants: Variant[];
  inStock: boolean;
  inventoryQuantity: number;
  basePrice: number;
  compareAtPrice?: number | null;
}

export function ProductActions({
  productId,
  productInfo,
  variants,
  inStock,
  inventoryQuantity,
  basePrice,
  compareAtPrice,
}: ProductActionsProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("product");
  const { addItem, openCheckout } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  const [quantity, setQuantity] = useState(1);

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

  const buyNow = () => {
    if (!validateSelection()) return;
    addItem(
      {
        id: productId,
        name: productInfo?.name || "منتج صحرا",
        nameAr: productInfo?.nameAr || "منتج صحرا",
        slug: productInfo?.slug || productId,
        image: productInfo?.image || "/placeholder.png",
        price: selectedPrice,
      },
      selectedVariantId,
      quantity,
      false // Do not open drawer, directly open checkout popup!
    );
    openCheckout();
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
        productDetails={{
          id: productId,
          name: productInfo?.name || "منتج صحرا",
          nameAr: productInfo?.nameAr || "منتج صحرا",
          slug: productInfo?.slug || productId,
          image: productInfo?.image || "/placeholder.png",
          price: selectedPrice,
        }}
        onError={() => undefined}
      />
      <Button
        type="button"
        size="lg"
        className="min-w-0 flex-1 bg-amber-500 font-extrabold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20"
        onClick={buyNow}
        disabled={!canPurchase}
      >
        <Zap className="h-4 w-4" />
        {isAr ? "اطلب الآن (دفع عند الاستلام)" : t("buyNow")}
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
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selectedVariantId;
              const disabled = variant.stock < 1;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant)}
                  disabled={disabled}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                    active
                      ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    disabled && "cursor-not-allowed opacity-40"
                  )}
                  aria-pressed={active}
                >
                  {variant.colorHex && (
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: variant.colorHex }}
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    {isAr
                      ? variant.nameAr || variant.name
                      : variant.name}
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-amber-600" />}
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

      {/* Volume Tier Incentive Box */}
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-slate-800">
        <div className="font-bold text-amber-900 mb-1">
          {isAr ? "💡 باقات التوفير الحصرية الشاملة للتوصيل:" : "Exclusive Bundle Savings:"}
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center font-semibold pt-1">
          <div className="rounded-lg bg-white p-2 border border-amber-200/60 shadow-sm">
            <span className="block text-[11px] text-slate-500">{isAr ? "منتج واحد" : "1 Item"}</span>
            <span className="font-black text-slate-900">199 ر.س</span>
          </div>
          <div className="rounded-lg bg-white p-2 border border-amber-300 shadow-sm relative overflow-hidden">
            <span className="block text-[11px] text-slate-500">{isAr ? "منتجان" : "2 Items"}</span>
            <span className="font-black text-amber-700">279 ر.س</span>
          </div>
          <div className="rounded-lg bg-amber-500/20 p-2 border border-amber-400 shadow-sm">
            <span className="block text-[11px] text-amber-900 font-bold">{isAr ? "3 منتجات" : "3 Items"}</span>
            <span className="font-black text-amber-900">349 ر.س</span>
          </div>
        </div>
      </div>

      {quantityOffer.discount > 0 && (
        <p className="mt-2 text-sm font-bold text-emerald-700 flex items-center gap-1.5">
          <span>{isAr ? "الإجمالي مع خصم الباقة:" : "Total with bundle discount:"}</span>
          <span className="text-base font-extrabold">{formatPrice(quantityOffer.total, "SAR", locale)}</span>
        </p>
      )}

      {availableStock > 0 && availableStock <= 5 && (
        <p className="mt-2 text-sm font-semibold text-orange-500">
          {t("onlyUnitsLeft", { count: availableStock })}
        </p>
      )}

      {actions()}

      {/* Floating Sticky Buy Bar for Mobile CRO */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur shadow-2xl sm:hidden">
        {actions(true)}
      </div>
    </div>
  );
}
