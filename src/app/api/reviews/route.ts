import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { reviewSchema } from "@/lib/validations/product";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";
import { cacheDel } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = z
      .object({
        productId: z.string().min(1),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(20).default(6),
      })
      .parse({
        productId: searchParams.get("productId"),
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      });

    const product = await prisma.product.findFirst({
      where: { id: query.productId, status: "APPROVED" },
      select: { id: true, rating: true, reviewCount: true },
    });
    if (!product) return apiError("Product not found", 404);

    const [reviews, distribution] = await Promise.all([
      prisma.review.findMany({
        where: { productId: query.productId },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          user: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId: query.productId },
        _count: { _all: true },
      }),
    ]);

    return apiSuccess({
      reviews,
      average: product.rating,
      distribution: [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count:
          distribution.find((item) => item.rating === rating)?._count._all ?? 0,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: product.reviewCount,
        pages: Math.ceil(product.reviewCount / query.limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const body = await request.json();
    const { productId, ...reviewData } = z
      .object({ productId: z.string() })
      .merge(reviewSchema)
      .parse(body);

    const delivered = await prisma.order.findFirst({
      where: {
        userId: auth.user.userId,
        status: "DELIVERED",
        items: { some: { productId } },
      },
    });

    const review = await prisma.review.upsert({
      where: {
        productId_userId: { productId, userId: auth.user.userId },
      },
      update: reviewData,
      create: {
        productId,
        userId: auth.user.userId,
        isVerified: !!delivered,
        ...reviewData,
      },
    });

    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (product) await cacheDel(`product:${product.slug}`);

    return apiSuccess(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
