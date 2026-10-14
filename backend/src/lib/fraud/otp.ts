import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { otpEnabled, otpTtlSeconds } from "./config";

export function hashOtp(orderId: string, code: string): string {
  return createHash("sha256").update(`${orderId}:${code}`).digest("hex");
}

export function otpMatches(orderId: string, code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtp(orderId, code));
  const expected = Buffer.from(expectedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function createOtpCode(): string {
  return String(randomInt(0, 10000)).padStart(4, "0");
}

export function otpExpiry(): Date {
  return new Date(Date.now() + otpTtlSeconds() * 1000);
}

/** Failure to reach the SMS/WhatsApp provider must not fail the order. */
export async function deliverOtp(phone: string, code: string, orderNumber: string): Promise<"sent" | "skipped" | "failed"> {
  if (!otpEnabled()) return "skipped";
  const url = process.env.FRAUD_OTP_WEBHOOK_URL;
  if (!url) {
    console.warn(`[otp] provider is not configured for order ${orderNumber}`);
    return "failed";
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, orderNumber }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.warn(`[otp] provider status ${response.status} for order ${orderNumber}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.warn(`[otp] provider failed for order ${orderNumber}`, error instanceof Error ? error.name : "");
    return "failed";
  }
}
