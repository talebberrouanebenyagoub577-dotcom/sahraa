function flag(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function integer(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function fraudEnabled(): boolean {
  return flag("FRAUD_GUARD_ENABLED", true);
}

export function purchaseRequiresConfirmation(): boolean {
  return flag("FRAUD_PURCHASE_REQUIRES_CONFIRMATION", true);
}

export function phoneWindowMs(): number {
  return integer("FRAUD_PHONE_WINDOW_MINUTES", 15) * 60 * 1000;
}

export function phoneMaxOrders(): number {
  return integer("FRAUD_PHONE_MAX", 2);
}

export function orderRateMax(): number {
  return integer("FRAUD_ORDER_RATE_MAX", 8);
}

export function orderRateWindowMs(): number {
  return integer("FRAUD_ORDER_RATE_WINDOW_MS", 600_000);
}

export function mediumCanSelfConfirm(): boolean {
  return flag("FRAUD_MEDIUM_CAN_SELF_CONFIRM", true);
}

export function otpEnabled(): boolean {
  return flag("FRAUD_OTP_ENABLED", false);
}

export function otpTtlSeconds(): number {
  return integer("FRAUD_OTP_TTL_SECONDS", 300);
}

export function geoForeignAction(): "review" | "block" {
  return process.env.GEOIP_FOREIGN_ACTION === "block" ? "block" : "review";
}

export function geoUnknownAction(): "allow" | "review" {
  return process.env.GEOIP_UNKNOWN_ACTION === "review" ? "review" : "allow";
}

export function geoSaOnly(): boolean {
  return flag("GEOIP_SA_ONLY", true);
}

export function geoCacheTtlMs(): number {
  return integer("GEOIP_CACHE_TTL_MS", 21_600_000);
}

export function trustProxy(): boolean {
  return flag("TRUST_PROXY", true);
}

export function trustCloudflare(): boolean {
  return flag("GEOIP_TRUST_CLOUDFLARE", false);
}
