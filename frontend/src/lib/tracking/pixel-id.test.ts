import assert from "node:assert/strict";
import { metaPixelBootstrap, runtimePixelIds, sanitizePixelId } from "./pixel-id";

assert.equal(sanitizePixelId("123456789012345"), "123456789012345");
assert.equal(sanitizePixelId(" 123456789012345 "), "123456789012345");
assert.equal(sanitizePixelId(""), "");
assert.equal(sanitizePixelId(undefined), "");
assert.equal(sanitizePixelId("id with space"), "");
assert.equal(sanitizePixelId("javascript:alert(1)"), "");
assert.equal(sanitizePixelId("'123'"), "");

const previous = process.env.NEXT_PUBLIC_META_PIXEL_ID;
process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456789012345";
assert.equal(runtimePixelIds().META, "123456789012345");
if (previous === undefined) delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
else process.env.NEXT_PUBLIC_META_PIXEL_ID = previous;

const snippet = metaPixelBootstrap("123456789012345");
assert.ok(snippet.includes('fbq(\'init\',"123456789012345")'));
assert.match(snippet, /fbq\('track','PageView'\)/);
assert.equal(metaPixelBootstrap(""), "");

console.log("pixel-id sanitize ok");
