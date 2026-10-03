import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/redis";
import { apiError } from "./response";

export async function withRateLimit(
  request: NextRequest,
  identifier?: string
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const key = identifier || ip;
  const max = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);

  const { allowed, remaining } = await rateLimit(key, max, windowMs);

  if (!allowed) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  return { remaining };
}
