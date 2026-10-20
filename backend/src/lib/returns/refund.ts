export type ShippingBearer = "CUSTOMER" | "STORE";

export type RefundBreakdown = {
  goodsAmount: number;
  returnShippingCost: number;
  shippingBearer: ShippingBearer;
  deductShipping: boolean;
  shippingDeducted: number;
  refundAmount: number;
};

export function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100;
}

export function calculateReturnRefund(input: {
  goodsAmount: number;
  returnShippingCost: number;
  shippingBearer: ShippingBearer;
  deductShipping: boolean;
  approved: boolean;
}): RefundBreakdown {
  const goodsAmount = roundMoney(input.goodsAmount);
  const returnShippingCost = roundMoney(input.returnShippingCost);
  const mayDeduct =
    input.approved &&
    input.deductShipping &&
    input.shippingBearer === "CUSTOMER" &&
    returnShippingCost > 0;
  const shippingDeducted = mayDeduct ? returnShippingCost : 0;
  return {
    goodsAmount,
    returnShippingCost,
    shippingBearer: input.shippingBearer,
    deductShipping: input.deductShipping,
    shippingDeducted,
    refundAmount: roundMoney(goodsAmount - shippingDeducted),
  };
}

export function canRecordManualRefund(status: string, refundExists: boolean): boolean {
  if (refundExists) return false;
  return status === "APPROVED" || status === "AWAITING_RECEIPT" || status === "RECEIVED";
}

export const COUNTED_RETURN_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "AWAITING_RECEIPT",
  "RECEIVED",
  "REFUNDED",
  "COMPLETED",
] as const;

export function claimedQuantityByOrderItem(
  returns: Array<{
    status: string;
    items: Array<{ orderItemId: string; quantity: number; acceptedQuantity: number | null }>;
  }>,
): Map<string, number> {
  const claimed = new Map<string, number>();
  for (const request of returns) {
    if (request.status === "REJECTED") continue;
    for (const item of request.items) {
      const qty =
        request.status === "PENDING_REVIEW" ? item.quantity : (item.acceptedQuantity ?? item.quantity);
      claimed.set(item.orderItemId, (claimed.get(item.orderItemId) || 0) + qty);
    }
  }
  return claimed;
}
