export const PRODUCT_UNIT_PRICE = 199;
export const BUNDLE_QUANTITY = 3;
export const BUNDLE_PRICE = 399;
export const FREE_SHIPPING_COST = 0;

export type OfferTotals = {
  subtotal: number;
  itemCount: number;
  bundleCount: number;
  remainingToBundle: number;
  bundleDiscount: number;
  couponDiscount: number;
  discount: number;
  shippingCost: number;
  total: number;
};

export function cartItemCount(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function offerMerchandiseTotal(itemCount: number): number {
  if (itemCount <= 0) return 0;
  const bundles = Math.floor(itemCount / BUNDLE_QUANTITY);
  const remainder = itemCount % BUNDLE_QUANTITY;
  return bundles * BUNDLE_PRICE + remainder * PRODUCT_UNIT_PRICE;
}

export function quoteOfferTotals(
  subtotal: number,
  itemCount: number,
  couponDiscount = 0
): OfferTotals {
  const merchandiseTotal = offerMerchandiseTotal(itemCount);
  const bundleDiscount = Math.max(0, Math.min(subtotal, subtotal - merchandiseTotal));
  const afterBundle = Math.max(0, subtotal - bundleDiscount);
  const appliedCoupon = Math.max(0, Math.min(couponDiscount, afterBundle));
  const discount = bundleDiscount + appliedCoupon;
  const remainder = itemCount % BUNDLE_QUANTITY;
  const remainingToBundle =
    itemCount > 0 && remainder !== 0 ? BUNDLE_QUANTITY - remainder : 0;

  return {
    subtotal,
    itemCount,
    bundleCount: Math.floor(itemCount / BUNDLE_QUANTITY),
    remainingToBundle,
    bundleDiscount,
    couponDiscount: appliedCoupon,
    discount,
    shippingCost: FREE_SHIPPING_COST,
    total: Math.max(0, subtotal - discount) + FREE_SHIPPING_COST,
  };
}
