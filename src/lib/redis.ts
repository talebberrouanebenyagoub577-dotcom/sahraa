import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | null };

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 1000,
      retryStrategy: () => null,
    });
    client.on("error", (err) => console.error("Redis error:", err.message));
    return client;
  } catch {
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();
if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    /* ignore cache write failures */
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    /* ignore */
  }
}

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return { allowed: true, remaining: max };

  try {
    const windowKey = `ratelimit:${key}`;
    const current = await redis.incr(windowKey);
    if (current === 1) {
      await redis.pexpire(windowKey, windowMs);
    }
    return { allowed: current <= max, remaining: Math.max(0, max - current) };
  } catch {
    return { allowed: true, remaining: max };
  }
}
