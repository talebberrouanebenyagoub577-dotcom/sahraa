import { mediaUrl } from "./media";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(mediaUrl("https://cdn.example/a.jpg") === "https://cdn.example/a.jpg", "absolute");
assert(mediaUrl("/images/a.jpg") === "/images/a.jpg", "public image stays");
const uploads = mediaUrl("/uploads/products/a.jpg");
assert(
  uploads === "/uploads/products/a.jpg" || uploads.endsWith("/uploads/products/a.jpg"),
  `uploads ${uploads}`,
);
console.log("media url ok");
