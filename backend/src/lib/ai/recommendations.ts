import prisma from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function getPersonalizedRecommendations(
  userId: string,
  limit = 12
) {
  const cacheKey = `ai:rec:${userId}:${limit}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const recentlyViewed = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: 5,
    include: { product: { include: { category: true } } },
  });

  const categoryIds = [
    ...new Set(recentlyViewed.map((r) => r.product.categoryId)),
  ];

  const orderHistory = await prisma.order.findMany({
    where: { userId, status: "DELIVERED" },
    include: { items: true },
    take: 10,
  });

  const purchasedProductIds = orderHistory.flatMap((o) =>
    o.items.map((i) => i.productId)
  );

  const recommendations = await prisma.product.findMany({
    where: {
      status: "APPROVED",
      id: { notIn: purchasedProductIds },
      ...(categoryIds.length > 0
        ? { categoryId: { in: categoryIds } }
        : {}),
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      seller: { select: { storeName: true, storeNameAr: true, rating: true } },
    },
    orderBy: [{ rating: "desc" }, { soldCount: "desc" }],
    take: limit,
  });

  if (recommendations.length < limit) {
    const trending = await prisma.product.findMany({
      where: {
        status: "APPROVED",
        isTrending: true,
        id: {
          notIn: [
            ...purchasedProductIds,
            ...recommendations.map((r) => r.id),
          ],
        },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { storeName: true, storeNameAr: true, rating: true } },
      },
      take: limit - recommendations.length,
    });
    recommendations.push(...trending);
  }

  await cacheSet(cacheKey, recommendations, 600);
  return recommendations;
}

export async function getCrossSellProducts(productId: string, limit = 6) {
  const relations = await prisma.productRelation.findMany({
    where: { productId, type: { in: ["cross_sell", "bought_together"] } },
    include: {
      related: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    take: limit,
  });

  if (relations.length >= limit) {
    return relations.map((r) => r.related);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!product) return [];

  const similar = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      status: "APPROVED",
      id: { not: productId },
    },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { soldCount: "desc" },
    take: limit,
  });

  return similar;
}

export async function getFrequentlyBoughtTogether(
  productId: string,
  limit = 4
) {
  const relations = await prisma.productRelation.findMany({
    where: { productId, type: "bought_together" },
    include: {
      related: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
    take: limit,
  });

  return relations.map((r) => r.related);
}
