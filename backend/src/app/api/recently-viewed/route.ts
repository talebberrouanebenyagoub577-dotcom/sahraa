import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const excludeProductId = searchParams.get("excludeProductId") || undefined;
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") || "5", 10), 1),
      10
    );

    const items = await prisma.recentlyViewed.findMany({
      where: {
        userId: auth.user.userId,
        product: {
          status: "APPROVED",
          ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
        },
      },
      orderBy: { viewedAt: "desc" },
      take: limit,
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            inventory: { select: { quantity: true } },
          },
        },
      },
    });

    return apiSuccess(items.map((item) => item.product));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { productId } = z
      .object({ productId: z.string().min(1) })
      .parse(await request.json());

    const product = await prisma.product.findFirst({
      where: { id: productId, status: "APPROVED" },
      select: { id: true },
    });
    if (!product) return apiError("Product not found", 404);

    await prisma.recentlyViewed.upsert({
      where: {
        userId_productId: { userId: auth.user.userId, productId },
      },
      update: { viewedAt: new Date() },
      create: { userId: auth.user.userId, productId },
    });

    return apiSuccess({ tracked: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
