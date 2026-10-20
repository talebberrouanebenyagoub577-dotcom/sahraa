import { resolveUploadPath, publicUploadUrl } from "./uploads";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(resolveUploadPath("/uploads/products/a.jpg")?.endsWith("a.jpg"), "valid upload path");
assert(resolveUploadPath("/uploads/../secret.txt") === null, "reject parent traversal");
assert(resolveUploadPath("/uploads/products/../../etc/passwd") === null, "reject nested traversal");
assert(resolveUploadPath("/api/products") === null, "reject non-upload path");

const url = publicUploadUrl(
  { headers: new Headers({ host: "api.sahraaaaaaaaaaa.shop", "x-forwarded-proto": "https" }) },
  "/uploads/products/a.jpg",
);
assert(url === "https://api.sahraaaaaaaaaaa.shop/uploads/products/a.jpg", `public url ${url}`);

console.log("uploads helper ok");
