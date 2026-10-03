import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cacheKey = `product:${slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return apiSuccess(cached);

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true } },
        category: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            storeNameAr: true,
            slug: true,
            rating: true,
            logo: true,
          },
        },
        inventory: true,
        faqs: { orderBy: { sortOrder: "asc" } },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (!product || product.status !== "APPROVED") {
      return apiError("Product not found", 404);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    const auth = getAuthFromRequest(request);
    if (auth) {
      await prisma.recentlyViewed.upsert({
        where: {
          userId_productId: {
            userId: auth.user.userId,
            productId: product.id,
          },
        },
        update: { viewedAt: new Date() },
        create: {
          userId: auth.user.userId,
          productId: product.id,
        },
      });
    }

    await cacheSet(cacheKey, product, 600);
    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}
