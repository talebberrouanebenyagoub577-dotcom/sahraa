import {
  calculateReturnRefund,
  canRecordManualRefund,
  claimedQuantityByOrderItem,
} from "./refund";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const pending = calculateReturnRefund({
  goodsAmount: 199,
  returnShippingCost: 25,
  shippingBearer: "CUSTOMER",
  deductShipping: true,
  approved: false,
});
assert(pending.shippingDeducted === 0, "do not deduct shipping before approval");
assert(pending.refundAmount === 199, "proposed refund is goods only before approval");

const approvedCustomer = calculateReturnRefund({
  goodsAmount: 199,
  returnShippingCost: 25,
  shippingBearer: "CUSTOMER",
  deductShipping: true,
  approved: true,
});
assert(approvedCustomer.shippingDeducted === 25, "deduct return shipping once after approval");
assert(approvedCustomer.refundAmount === 174, "refund is goods minus return shipping");

const storeBears = calculateReturnRefund({
  goodsAmount: 199,
  returnShippingCost: 25,
  shippingBearer: "STORE",
  deductShipping: true,
  approved: true,
});
assert(storeBears.shippingDeducted === 0, "store-borne shipping is not deducted");
assert(storeBears.refundAmount === 199, "customer receives full goods amount");

const policyOff = calculateReturnRefund({
  goodsAmount: 199,
  returnShippingCost: 25,
  shippingBearer: "CUSTOMER",
  deductShipping: false,
  approved: true,
});
assert(policyOff.shippingDeducted === 0, "policy can forbid shipping deduction");
assert(policyOff.refundAmount === 199, "legal policy keeps full goods refund");

const floor = calculateReturnRefund({
  goodsAmount: 10,
  returnShippingCost: 25,
  shippingBearer: "CUSTOMER",
  deductShipping: true,
  approved: true,
});
assert(floor.refundAmount === 0, "refund never goes negative");

assert(canRecordManualRefund("RECEIVED", false) === true, "manual COD refund allowed after receive");
assert(canRecordManualRefund("RECEIVED", true) === false, "block duplicate refund ledger");
assert(canRecordManualRefund("PENDING_REVIEW", false) === false, "no refund before approval");

const claimed = claimedQuantityByOrderItem([
  {
    status: "REJECTED",
    items: [{ orderItemId: "a", quantity: 2, acceptedQuantity: 2 }],
  },
  {
    status: "REFUNDED",
    items: [{ orderItemId: "a", quantity: 1, acceptedQuantity: 1 }],
  },
  {
    status: "PENDING_REVIEW",
    items: [{ orderItemId: "a", quantity: 1, acceptedQuantity: null }],
  },
]);
assert(claimed.get("a") === 2, "rejected qty ignored; refunded + pending counted");

console.log("return refund math ok");
