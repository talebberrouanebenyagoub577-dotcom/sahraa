import prisma from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "categories:tree";
    const cached = await cacheGet(cacheKey);
    if (cached) return apiSuccess(cached);

    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    await cacheSet(cacheKey, categories, 3600);
    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
