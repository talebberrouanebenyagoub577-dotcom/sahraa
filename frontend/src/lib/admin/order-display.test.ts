import assert from "node:assert/strict";
import { formatAdminItemLine, readAdminOrders } from "./order-display";

assert.equal(
  formatAdminItemLine(
    { name: "Hair Concealer", nameAr: "بخاخ إخفاء فراغات الشعر", quantity: 2, size: "M", color: "أسود" },
    "ar"
  ),
  "بخاخ إخفاء فراغات الشعر ×2 (M / أسود)"
);
assert.equal(
  formatAdminItemLine({ name: "Kohl", nameAr: "كحل", quantity: 1 }, "en"),
  "Kohl ×1"
);

assert.equal(
  readAdminOrders({ success: true, data: { orders: [{ id: "ord_1", orderNumber: "SHR-1" }] } }).length,
  1
);
assert.equal(readAdminOrders({ data: [{ id: "ord_2" }] }).length, 1);
assert.equal(readAdminOrders({ error: "Unauthorized" }).length, 0);

console.log("admin order display ok");
