export const PRODUCT_UNIT_PRICE = 199;
export const PRICE_TIER_1 = 199; // 1 product: 199 SAR
export const PRICE_TIER_2 = 279; // 2 products: 279 SAR
export const PRICE_TIER_3 = 349; // 3 products: 349 SAR
export const UPSELL_SPECIAL_PRICE = 99; // Upsell special offer: 99 SAR
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
  hasUpsell?: boolean;
  upsellAmount?: number;
};

export function cartItemCount(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calculates the tier merchandise price according to the volume pricing rules:
 * - 1 item: 199 SAR
 * - 2 items: 279 SAR
 * - 3 items: 349 SAR
 * For larger quantities, multiples of 3 cost 349 SAR each, with:
 * - 1 remaining item costing +199 SAR
 * - 2 remaining items costing +279 SAR
 */
export function calculateTierPrice(itemCount: number): number {
  if (itemCount <= 0) return 0;
  const bundlesOf3 = Math.floor(itemCount / 3);
  const remainder = itemCount % 3;
  let remainderPrice = 0;
  if (remainder === 1) remainderPrice = PRICE_TIER_1;
  else if (remainder === 2) remainderPrice = PRICE_TIER_2;
  return bundlesOf3 * PRICE_TIER_3 + remainderPrice;
}

export function offerMerchandiseTotal(itemCount: number): number {
  return calculateTierPrice(itemCount);
}

export function quoteOfferTotals(
  subtotal: number,
  itemCount: number,
  couponDiscount = 0,
  hasUpsell = false
): OfferTotals {
  const merchandiseTotal = calculateTierPrice(itemCount);
  const standardSubtotal = itemCount * PRODUCT_UNIT_PRICE;
  // Volume tier savings:
  const bundleDiscount = Math.max(0, standardSubtotal - merchandiseTotal);
  const upsellAmount = hasUpsell ? UPSELL_SPECIAL_PRICE : 0;
  const total = merchandiseTotal + upsellAmount;

  const remainder = itemCount % 3;
  const remainingToBundle = remainder === 0 ? 0 : 3 - remainder;

  return {
    subtotal: standardSubtotal + upsellAmount,
    itemCount: itemCount + (hasUpsell ? 1 : 0),
    bundleCount: Math.floor(itemCount / 3),
    remainingToBundle,
    bundleDiscount,
    couponDiscount: 0, // No coupon discount on the site
    discount: bundleDiscount,
    shippingCost: FREE_SHIPPING_COST,
    total,
    hasUpsell,
    upsellAmount,
  };
}
