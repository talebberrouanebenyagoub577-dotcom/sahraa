import assert from "node:assert/strict";
import { adminCustomerOf, parsePageLimit, readShippingContact, toAdminListRow, variantOptions } from "./admin-view";

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

const listed = toAdminListRow({
  id: "ord_1",
  orderNumber: "SHR-TEST-1",
  status: "PENDING",
  paymentMethod: "COD",
  total: 199,
  currency: "SAR",
  createdAt: new Date("2026-10-26T18:20:10.913Z"),
  shippingAddress: { firstName: "SAHRAA TEST ORDER DO NOT SHIP", phone: "0500000099", city: "Riyadh" },
  phoneE164: "+966500000099",
  items: [{ name: "EMS Foot Massager", nameAr: "مساج", quantity: 1, size: null, color: null }],
});
assert.equal(listed.customer.fullName, "SAHRAA TEST ORDER DO NOT SHIP");
assert.equal(listed.customer.phone, "0500000099");
assert.equal(listed.customer.city, "Riyadh");
assert.equal(listed.items[0].name, "EMS Foot Massager");
assert.equal(listed.items[0].quantity, 1);

const paging = parsePageLimit(new URLSearchParams("limit=50"));
assert.equal(paging.page, 1);
assert.equal(paging.limit, 50);
assert.equal(parsePageLimit(new URLSearchParams("page=0&limit=999")).limit, 100);

console.log("admin order view helpers ok");
