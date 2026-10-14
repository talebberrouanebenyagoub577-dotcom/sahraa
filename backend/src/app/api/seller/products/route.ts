import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, SELLER_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, SELLER_ROLES)) return apiError("Unauthorized", 401);

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth!.user.userId },
    });
    if (!seller) return apiError("Seller profile not found", 404);

    const products = await prisma.product.findMany({
      where: { sellerId: seller.id },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        inventory: { select: { quantity: true } },
        category: { select: { name: true, nameAr: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(products);
  } catch (error) {
    return handleApiError(error);
  }
}
