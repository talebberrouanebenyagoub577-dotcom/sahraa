import assert from "node:assert/strict";
import { adminCustomerOf, readShippingContact, variantOptions } from "./admin-view";

const address = readShippingContact({
  firstName: "أحمد",
  lastName: "العلي",
  phone: "0501234567",
  city: "الرياض",
});
assert.equal(address.fullName, "أحمد العلي");
assert.equal(address.phone, "0501234567");
assert.equal(address.city, "الرياض");

const fromCheckout = adminCustomerOf({
  shippingAddress: { firstName: "سارة محمد", phone: "+966501112223", city: "جدة" },
  phoneE164: "+966501112223",
});
assert.equal(fromCheckout.fullName, "سارة محمد");
assert.equal(fromCheckout.phone, "+966501112223");
assert.equal(fromCheckout.city, "جدة");

const fallback = adminCustomerOf({
  shippingAddress: {},
  phoneE164: "+966509998887",
  user: { firstName: "نورة", lastName: "سعد", phone: "0550000000" },
});
assert.equal(fallback.fullName, "نورة سعد");
assert.equal(fallback.phone, "+966509998887");

assert.deepEqual(variantOptions({ size: "M", color: "أسود" }), { size: "M", color: "أسود" });
assert.deepEqual(variantOptions(null), { size: null, color: null });

console.log("admin order view helpers ok");
