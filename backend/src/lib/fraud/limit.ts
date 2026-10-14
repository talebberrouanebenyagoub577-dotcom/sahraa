import { orderRateMax, orderRateWindowMs } from "./config";

const hits = new Map<string, number[]>();

export function consumeRate(key: string, max = orderRateMax(), windowMs = orderRateWindowMs()): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((at) => now - at < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function resetRateForTests(): void {
  hits.clear();
}
