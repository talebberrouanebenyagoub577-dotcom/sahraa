import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  const checks: Record<string, string> = { api: "ok" };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    if (redis) {
      await redis.ping();
      checks.redis = "ok";
    } else {
      checks.redis = "not_configured";
    }
  } catch {
    checks.redis = "error";
  }

  const healthy = checks.database === "ok";
  const status = healthy ? "healthy" : "degraded";

  return apiSuccess(
    {
      status,
      service: "sahraa",
      checks,
      timestamp: new Date().toISOString(),
    },
    healthy ? 200 : 503
  );
}
