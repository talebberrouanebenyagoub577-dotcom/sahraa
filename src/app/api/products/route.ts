import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const category = searchParams.get("category");
    const section = searchParams.get("section");
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const cacheKey = `products:${page}:${limit}:${category}:${section}:${sort}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return apiSuccess(cached);

    const where: Record<string, unknown> = { status: "APPROVED" };

    if (category) where.category = { slug: category };
    if (section === "featured") where.isFeatured = true;
    if (section === "trending") where.isTrending = true;
    if (section === "flashDeals") where.isFlashDeal = true;
    if (section === "newArrivals") where.isNewArrival = true;
    if (section === "bestSellers") {
      /* sorted by soldCount below */
    }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      };
    }

    const orderBy: Record<string, string> =
      section === "bestSellers"
        ? { soldCount: "desc" }
        : sort === "price_asc"
          ? { price: "asc" }
          : sort === "price_desc"
            ? { price: "desc" }
            : sort === "rating"
              ? { rating: "desc" }
              : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, nameAr: true, slug: true } },
          seller: { select: { storeName: true, storeNameAr: true, rating: true } },
          inventory: { select: { quantity: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    await cacheSet(cacheKey, result, 300);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  return apiError(
    "Product creation is disabled. Only administrators can add products.",
    403
  );
}
