import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { cacheGet, cacheSet } from "@/lib/redis";
import { CountryCode } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") as CountryCode | null;

    const cacheKey = `banners:${country || "all"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return apiSuccess(cached);

    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
          country
            ? { OR: [{ country }, { country: null }] }
            : {},
        ],
      },
      orderBy: { sortOrder: "asc" },
    });

    await cacheSet(cacheKey, banners, 600);
    return apiSuccess(banners);
  } catch (error) {
    return handleApiError(error);
  }
}
