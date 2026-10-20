import { catalogErrorMessage, formatFieldErrors } from "./catalog-error";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  formatFieldErrors({ "images.0.url": ["Invalid URL"] }) === "images.0.url: Invalid URL",
  "path from server issues",
);
assert(
  formatFieldErrors({ images: ["Invalid URL"] }) === "images: Invalid URL",
  "flattened images array",
);
assert(
  catalogErrorMessage(
    { error: "Validation failed", errors: { "images.0.url": ["Invalid URL"] } },
    "sku",
    "fallback",
  ) === "Validation failed — images.0.url: Invalid URL",
  "toast includes field path",
);

console.log("catalog error message ok");
