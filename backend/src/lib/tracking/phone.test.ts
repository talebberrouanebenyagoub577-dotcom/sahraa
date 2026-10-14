import assert from "node:assert/strict";
import {
  hashPhoneForMeta,
  hashPhoneForTikTok,
  normalizeSaudiPhone,
  sha256Hex,
} from "./phone";

const sample = "0512345678";
const normalized = normalizeSaudiPhone(sample);
assert.ok(normalized);
assert.equal(normalized.meta, "966512345678");
assert.equal(normalized.tiktok, "+966512345678");

for (const input of ["512345678", "+966512345678", "966512345678", "00966512345678"]) {
  const phone = normalizeSaudiPhone(input);
  assert.equal(phone?.meta, "966512345678", input);
  assert.equal(phone?.tiktok, "+966512345678", input);
}

const metaHash = hashPhoneForMeta(sample);
const tiktokHash = hashPhoneForTikTok(sample);
assert.equal(metaHash, sha256Hex("966512345678"));
assert.equal(tiktokHash, sha256Hex("+966512345678"));
assert.notEqual(metaHash, tiktokHash);
assert.match(metaHash || "", /^[a-f0-9]{64}$/);
assert.equal(hashPhoneForMeta(""), null);
assert.equal(hashPhoneForMeta("123"), null);

console.log("phone normalization ok");
