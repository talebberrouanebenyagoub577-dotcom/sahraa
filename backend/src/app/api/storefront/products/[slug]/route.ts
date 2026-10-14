import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getCrossSellProducts } from "@/lib/ai/recommendations";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { where: { isActive: true }, orderBy: { name: "asc" as const } },
  category: true,
  seller: true,
  inventory: true,
  faqs: { orderBy: { sortOrder: "asc" as const } },
  reviews: {
    take: 6,
    orderBy: { createdAt: "desc" as const },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug }, include: productInclude });
    if (!product || product.status !== "APPROVED") return apiError("Product not found", 404);

    const [related, moreFromSeller, reviewGroups, sellerProductCount] = await Promise.all([
      getCrossSellProducts(product.id, 5),
      prisma.product.findMany({
        where: { sellerId: product.sellerId, status: "APPROVED", id: { not: product.id } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          inventory: { select: { quantity: true } },
        },
        orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId: product.id },
        _count: { _all: true },
      }),
      prisma.product.count({ where: { sellerId: product.sellerId, status: "APPROVED" } }),
    ]);

    return apiSuccess({ product, related, moreFromSeller, reviewGroups, sellerProductCount });
  } catch (error) {
    return handleApiError(error);
  }
}
