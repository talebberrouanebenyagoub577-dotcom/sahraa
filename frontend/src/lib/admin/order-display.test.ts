import assert from "node:assert/strict";
import { formatAdminItemLine } from "./order-display";

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

console.log("admin order display ok");
