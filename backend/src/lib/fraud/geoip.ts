import fs from "node:fs";
import { geoCacheTtlMs } from "./config";
import { isIpAddress, isNonPublicIp } from "./ip";

interface CacheEntry {
  country: string | null;
  expiresAt: number;
}

interface CountryReader {
  get(ip: string): { country?: { iso_code?: string } } | null;
}

const cache = new Map<string, CacheEntry>();
const CACHE_MAX = 5000;
let reader: CountryReader | null | undefined;
let openFailed = false;
let missingLogged = false;

async function openReader(): Promise<CountryReader | null> {
  if (reader !== undefined) return reader;
  const dbPath = process.env.MAXMIND_DB_PATH;
  if (!dbPath) {
    reader = null;
    return null;
  }
  if (!fs.existsSync(dbPath)) {
    if (!missingLogged) {
      missingLogged = true;
      console.warn("[geoip] MAXMIND_DB_PATH is set but the database file is missing");
    }
    reader = null;
    return null;
  }
  try {
    const maxmind = await import("maxmind");
    reader = (await maxmind.open(dbPath)) as CountryReader;
    return reader;
  } catch (error) {
    if (!openFailed) {
      openFailed = true;
      console.warn("[geoip] failed to open database", error instanceof Error ? error.name : "");
    }
    reader = null;
    return null;
  }
}

export function rememberCountry(ip: string, country: string | null): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(ip, { country, expiresAt: Date.now() + geoCacheTtlMs() });
}

export async function lookupCountry(ip: string | undefined): Promise<{ country: string | null; source: string }> {
  if (!ip || !isIpAddress(ip) || isNonPublicIp(ip)) {
    return { country: null, source: "unroutable" };
  }
  const hit = cache.get(ip);
  if (hit && hit.expiresAt > Date.now()) {
    return { country: hit.country, source: "cache" };
  }
  const lookup = await openReader();
  if (!lookup) return { country: null, source: "unavailable" };
  try {
    const row = lookup.get(ip);
    const country = row?.country?.iso_code?.toUpperCase() || null;
    rememberCountry(ip, country);
    return { country, source: "mmdb" };
  } catch (error) {
    console.warn("[geoip] lookup failed", error instanceof Error ? error.name : "");
    return { country: null, source: "error" };
  }
}

export function resetGeoIpForTests(): void {
  cache.clear();
  reader = undefined;
  openFailed = false;
  missingLogged = false;
}
