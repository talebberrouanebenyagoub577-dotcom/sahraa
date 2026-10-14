import { NextRequest } from "next/server";
import { getPersonalizedRecommendations } from "@/lib/ai/recommendations";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    if (auth) {
      const recommendations = await getPersonalizedRecommendations(
        auth.user.userId,
        limit
      );
      return apiSuccess(recommendations);
    }

    const trending = await prisma.product.findMany({
      where: { status: "APPROVED", isTrending: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { storeName: true, storeNameAr: true } },
      },
      take: limit,
    });

    return apiSuccess(trending);
  } catch (error) {
    return handleApiError(error);
  }
}
