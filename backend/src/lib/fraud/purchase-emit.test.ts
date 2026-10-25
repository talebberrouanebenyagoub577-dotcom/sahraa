import assert from "node:assert/strict";
import { ConfirmationState } from "@prisma/client";
import { checkoutPurchasePlan, previewPurchase } from "./purchase";
import { purchaseTracking } from "@/lib/tracking/capi";

const savedOrder = {
  status: "PENDING",
  confirmationState: ConfirmationState.REVIEW,
  orderNumber: "SAH-1042",
  total: 199,
  items: [
    {
      sku: "SAHRAA-HAIR-CONCEALER",
      name: "Hair Concealer",
      nameAr: "بخاخ إخفاء فراغات الشعر",
      quantity: 1,
      price: 199,
    },
  ],
};

const afterCreate = checkoutPurchasePlan(savedOrder);
assert.equal(afterCreate.emit, true, "Purchase is sent after the order row is saved");
assert.ok(afterCreate.tracking, "browser and server share the same tracking payload");
assert.equal(afterCreate.tracking?.purchase.metaName, "Purchase");
assert.equal(afterCreate.tracking?.purchase.currency, "SAR");
assert.equal(afterCreate.tracking?.purchase.value, 199);
assert.equal(afterCreate.tracking?.purchase.metaEventId, "SAH-1042_Purchase");
assert.equal(afterCreate.tracking?.purchase.orderId, "SAH-1042");

const again = previewPurchase(savedOrder);
assert.equal(
  again.purchase.metaEventId,
  afterCreate.tracking?.purchase.metaEventId,
  "browser and CAPI reuse the same event_id"
);

const payload = purchaseTracking({
  orderNumber: savedOrder.orderNumber,
  value: 199,
  contents: [{ id: "SAHRAA-HAIR-CONCEALER", quantity: 1, price: 199 }],
});
assert.equal(payload.metaName, "Purchase");
assert.equal(payload.currency, "SAR");
assert.equal(payload.metaEventId, "SAH-1042_Purchase");

assert.equal(
  checkoutPurchasePlan({ ...savedOrder, confirmationState: ConfirmationState.REJECTED }).emit,
  false,
  "rejected checkout does not send Purchase"
);
assert.equal(
  checkoutPurchasePlan({ ...savedOrder, status: "CANCELLED" }).emit,
  false,
  "cancelled checkout does not send Purchase"
);

console.log("purchase emit after checkout ok");
