import { catalogImageRows } from "./catalog-images";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const rows = catalogImageRows([
  { url: "/uploads/products/a.jpg" },
  { url: "/uploads/products/b.jpg", isPrimary: true, alt: "main" },
  { url: "/uploads/products/c.jpg" },
]);

assert(rows[0].url.endsWith("b.jpg"), "primary first");
assert(rows[0].isPrimary === true, "primary flag");
assert(rows[1].isPrimary === false && rows[2].isPrimary === false, "others not primary");
assert(rows[0].alt === "main", "alt preserved");

console.log("catalog images ok");
