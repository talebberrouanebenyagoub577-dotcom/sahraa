import { trustCloudflare, trustProxy } from "./config";

export function isIpAddress(value: string): boolean {
  return isIpv4(value) || isIpv6(value);
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255 && String(Number(part)) === String(Number(part)));
}

function isIpv6(value: string): boolean {
  if (!value.includes(":") || !/^[0-9a-f:]+$/i.test(value)) return false;
  const halves = value.split("::");
  if (halves.length > 2) return false;
  const groups = value.split(":").filter((group) => group.length > 0);
  return groups.length > 0 && groups.length <= 8 && groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group));
}

/** Private, loopback, link-local, and carrier-grade NAT addresses are not a country. */
export function isNonPublicIp(ip: string): boolean {
  const value = ip.trim().toLowerCase();
  if (value === "::1" || value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) return true;
  if (!isIpv4(value)) return false;
  const [a, b] = value.split(".").map(Number);
  if (a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

/**
 * EasyPanel/Nginx may set X-Real-IP. Cloudflare may set CF-Connecting-IP.
 * The browser-supplied first hop of X-Forwarded-For is never trusted.
 */
export function getTrustedClientIp(headers: { get(name: string): string | null }): string | undefined {
  if (trustCloudflare()) {
    const cloudflare = headers.get("cf-connecting-ip")?.trim();
    if (cloudflare && isIpAddress(cloudflare)) return cloudflare;
  }
  if (trustProxy()) {
    const real = headers.get("x-real-ip")?.trim();
    if (real && isIpAddress(real)) return real;
  }
  return undefined;
}
