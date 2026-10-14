import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api/response";

const productInclude = {
  images: { where: { isPrimary: true }, take: 1 },
  inventory: { select: { quantity: true } },
};

export async function GET(_request: NextRequest) {
  try {
    const [banners, categories, featured, trending, bestSellers, flashDeals, newArrivals, aiRecommended, reviews] =
      await Promise.all([
        prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 5 }),
        prisma.category.findMany({
          where: { isActive: true, parentId: null },
          include: { _count: { select: { products: true } } },
          orderBy: { sortOrder: "asc" },
          take: 8,
        }),
        prisma.product.findMany({
          where: { status: "APPROVED", isFeatured: true },
          include: productInclude,
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.product.findMany({ where: { status: "APPROVED", isTrending: true }, include: productInclude, take: 10 }),
        prisma.product.findMany({
          where: { status: "APPROVED" },
          include: productInclude,
          orderBy: { soldCount: "desc" },
          take: 10,
        }),
        prisma.product.findMany({ where: { status: "APPROVED", isFlashDeal: true }, include: productInclude, take: 10 }),
        prisma.product.findMany({
          where: { status: "APPROVED", isNewArrival: true },
          include: productInclude,
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.product.findMany({
          where: { status: "APPROVED" },
          include: productInclude,
          orderBy: { rating: "desc" },
          take: 10,
        }),
        prisma.review.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { firstName: true, lastName: true } },
            product: { select: { name: true, nameAr: true, slug: true } },
          },
        }),
      ]);

    return apiSuccess({
      banners,
      categories,
      featured,
      trending,
      bestSellers,
      flashDeals,
      newArrivals,
      aiRecommended,
      reviews,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
