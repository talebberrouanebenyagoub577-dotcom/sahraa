import { adminCreateProductSchema } from "./catalog-product-schema";
import { createProductSchema } from "../validations/product";
import { zodFieldErrors } from "../api/zod-errors";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const uploadedImagePayload = {
  name: "Test Product",
  nameAr: "منتج تجريب",
  description: "short",
  descriptionAr: "وصف قصير",
  categoryId: "cat_platform_1",
  price: 199,
  sku: "SKU-NEW-1",
  quantity: 10,
  codAvailable: true,
  status: "APPROVED" as const,
  images: [{ url: "/uploads/products/photo.jpg", isPrimary: true }],
};

const inherited = createProductSchema.safeParse(uploadedImagePayload);
assert(inherited.success === false, "base schema must reject uploaded relative image URLs");
assert(
  inherited.success === false && inherited.error.issues.some((issue) => issue.path.join(".") === "images.0.url"),
  "failing field is images.0.url",
);

const admin = adminCreateProductSchema.safeParse(uploadedImagePayload);
assert(admin.success === true, `admin schema must accept uploaded images: ${admin.success ? "" : JSON.stringify(admin.error.issues)}`);
if (admin.success) {
  assert(admin.data.images?.[0]?.url === "/uploads/products/photo.jpg", "relative upload url kept");
  assert(admin.data.images?.[0]?.isPrimary === true, "isPrimary kept");
}

if (inherited.success === false) {
  const fields = zodFieldErrors(inherited.error);
  assert(fields["images.0.url"]?.[0] === "Invalid URL", `expected images.0.url Invalid URL, got ${JSON.stringify(fields)}`);
}

console.log("admin catalog product schema ok");
