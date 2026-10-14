import { createHash } from "crypto";

export interface NormalizedPhone {
  /** Meta and Snap: digits, country code, no plus. */
  meta: string;
  /** TikTok: E.164 with plus. */
  tiktok: string;
}

/**
 * Saudi mobiles accepted at checkout: 05xxxxxxxx, 5xxxxxxxx, +9665xxxxxxxx.
 * Returns null when the number cannot be normalized.
 */
export function normalizeSaudiPhone(raw: string): NormalizedPhone | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/[^\d]/g, "");
  if (digits.startsWith("00966")) digits = digits.slice(2);
  if (digits.startsWith("966")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  if (!/^5\d{8}$/.test(digits)) return null;

  const meta = `966${digits}`;
  return { meta, tiktok: `+${meta}` };
}

/** Human-readable E.164. Falls back to the trimmed input when normalization fails. */
export function toE164(raw: string): string {
  return normalizeSaudiPhone(raw)?.tiktok || raw.trim();
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashPhoneForMeta(raw: string): string | null {
  const phone = normalizeSaudiPhone(raw);
  if (!phone) return null;
  return sha256Hex(phone.meta);
}

export function hashPhoneForTikTok(raw: string): string | null {
  const phone = normalizeSaudiPhone(raw);
  if (!phone) return null;
  return sha256Hex(phone.tiktok);
}

export function hashEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return sha256Hex(email);
}

export function hashName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const name = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!name) return null;
  return sha256Hex(name);
}

export function hashCity(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const city = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!city) return null;
  return sha256Hex(city);
}

export function hashCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const country = raw.trim().toLowerCase();
  if (!country) return null;
  return sha256Hex(country);
}
