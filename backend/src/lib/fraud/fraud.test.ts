import assert from "node:assert/strict";
import fs from "node:fs";
import { decideFraud, isVagueCity } from "./score";
import { lookupCountry, resetGeoIpForTests } from "./geoip";
import { getTrustedClientIp, isIpAddress, isNonPublicIp } from "./ip";
import { consumeRate, resetRateForTests } from "./limit";
import { deliverOtp, hashOtp, otpMatches } from "./otp";
import { sheetStatusFor } from "./purchase";
import { ConfirmationState } from "@prisma/client";

function signals(overrides: Partial<Parameters<typeof decideFraud>[0]> = {}) {
  return {
    shippingCountry: "SA",
    phoneValid: true,
    city: "الرياض",
    geoCountry: "SA",
    geoChecked: true,
    blacklisted: false,
    phoneOrdersInWindow: 0,
    ipOrdersInWindow: 0,
    deviceDistinctPhones: 0,
    cancelledOrReturned: 0,
    userAgent: "Mozilla/5.0",
    ...overrides,
  };
}

const saudi = decideFraud(signals());
assert.equal(saudi.action, "allow");
assert.equal(saudi.riskLevel, "LOW");

const abroad = decideFraud(signals({ shippingCountry: "AE" }));
assert.equal(abroad.action, "reject");
assert.match(abroad.message, /السعودية/);

const badPhone = decideFraud(signals({ phoneValid: false }));
assert.equal(badPhone.action, "reject");
assert.match(badPhone.message, /جوال/);

process.env.FRAUD_PHONE_MAX = "2";
const duplicate = decideFraud(signals({ phoneOrdersInWindow: 2 }));
assert.equal(duplicate.action, "reject");
assert.equal(duplicate.httpStatus, 429);

const vpn = decideFraud(signals({ geoCountry: "DE" }));
assert.equal(vpn.action, "review");
assert.equal(vpn.riskLevel, "MEDIUM");
assert.equal(vpn.reasons.includes("geo_foreign"), true);

const suspicious = decideFraud(signals({ geoCountry: "US", city: "مدينة أخرى", userAgent: "python-requests/2.0" }));
assert.equal(suspicious.action, "review");
assert.equal(suspicious.riskLevel, "HIGH");
assert.equal(suspicious.reasons.includes("geo_foreign"), true);
assert.equal(suspicious.reasons.includes("vague_city"), true);

const unknown = decideFraud(signals({ geoCountry: null, geoChecked: true }));
assert.equal(unknown.action, "allow");

process.env.GEOIP_FOREIGN_ACTION = "block";
const blockedGeo = decideFraud(signals({ geoCountry: "US" }));
assert.equal(blockedGeo.action, "reject");
delete process.env.GEOIP_FOREIGN_ACTION;

process.env.GEOIP_SA_ONLY = "false";
const foreignIgnored = decideFraud(signals({ geoCountry: "DE" }));
assert.equal(foreignIgnored.action, "allow");
delete process.env.GEOIP_SA_ONLY;

async function checkGeoAndOtp() {
  delete process.env.MAXMIND_DB_PATH;
  resetGeoIpForTests();
  assert.equal((await lookupCountry("127.0.0.1")).source, "unroutable");
  assert.equal((await lookupCountry("10.1.1.1")).source, "unroutable");
  assert.equal((await lookupCountry("not-an-ip")).source, "unroutable");
  assert.equal((await lookupCountry("8.8.8.8")).source, "unavailable");
  assert.equal((await lookupCountry("")).source, "unroutable");
  return true;
}


assert.equal(isVagueCity(""), true);
assert.equal(isVagueCity("الرياض"), false);
assert.equal(isIpAddress("not-an-ip"), false);
assert.equal(isNonPublicIp("127.0.0.1"), true);
assert.equal(isNonPublicIp("10.1.1.1"), true);
assert.equal(isNonPublicIp("8.8.8.8"), false);

process.env.TRUST_PROXY = "true";
process.env.GEOIP_TRUST_CLOUDFLARE = "false";
const spoofed = getTrustedClientIp({
  get(name: string) {
    if (name === "x-forwarded-for") return "1.2.3.4, 5.6.7.8";
    if (name === "x-real-ip") return "5.6.7.8";
    return null;
  },
});
assert.equal(spoofed, "5.6.7.8");

process.env.GEOIP_TRUST_CLOUDFLARE = "true";
const cloudflare = getTrustedClientIp({
  get(name: string) {
    if (name === "cf-connecting-ip") return "8.8.8.8";
    if (name === "x-real-ip") return "5.6.7.8";
    return null;
  },
});
assert.equal(cloudflare, "8.8.8.8");
delete process.env.GEOIP_TRUST_CLOUDFLARE;

resetRateForTests();
process.env.FRAUD_ORDER_RATE_MAX = "2";
process.env.FRAUD_ORDER_RATE_WINDOW_MS = "60000";
assert.equal(consumeRate("phone-test"), true);
assert.equal(consumeRate("phone-test"), true);
assert.equal(consumeRate("phone-test"), false);

async function checkOtpFailure() {
  const previousOtp = process.env.FRAUD_OTP_ENABLED;
  const previousWebhook = process.env.FRAUD_OTP_WEBHOOK_URL;
  process.env.FRAUD_OTP_ENABLED = "true";
  process.env.FRAUD_OTP_WEBHOOK_URL = "http://127.0.0.1:9";
  const otpResult = await deliverOtp("+966512345678", "1234", "SHR-TEST");
  assert.equal(otpResult, "failed");
  process.env.FRAUD_OTP_ENABLED = "false";
  assert.equal(await deliverOtp("+966512345678", "1234", "SHR-TEST"), "skipped");
  if (previousOtp === undefined) delete process.env.FRAUD_OTP_ENABLED;
  else process.env.FRAUD_OTP_ENABLED = previousOtp;
  if (previousWebhook === undefined) delete process.env.FRAUD_OTP_WEBHOOK_URL;
  else process.env.FRAUD_OTP_WEBHOOK_URL = previousWebhook;
}


assert.equal(otpMatches("order", "1234", hashOtp("order", "1234")), true);
assert.equal(otpMatches("order", "9999", hashOtp("order", "1234")), false);

assert.equal(sheetStatusFor(ConfirmationState.AWAITING, "PENDING"), "new");
assert.equal(sheetStatusFor(ConfirmationState.REVIEW, "PENDING"), "review");
assert.equal(sheetStatusFor(ConfirmationState.CONFIRMED, "CONFIRMED"), "confirmed");
assert.equal(sheetStatusFor(ConfirmationState.REJECTED, "CANCELLED"), "cancelled");

const migration = fs.readFileSync(new URL("../../../prisma/migrations/20261014193000_fraud_guard/migration.sql", import.meta.url), "utf8");
const locker = fs.readFileSync(new URL("../../migrate.ts", import.meta.url), "utf8");
assert.match(migration, /confirmationState/);
assert.match(migration, /FraudAttempt/);
assert.match(locker, /pg_advisory_lock\(9142026\)/);
assert.match(locker, /migrate deploy/);
assert.doesNotMatch(locker, /migrate dev/);

Promise.all([checkGeoAndOtp(), checkOtpFailure()])
  .then(() => {
    console.log("fraud guard ok");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
