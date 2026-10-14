import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, SELLER_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, SELLER_ROLES)) return apiError("Unauthorized", 401);

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth!.user.userId },
    });
    if (!seller) return apiError("Seller profile not found", 404);

    const inventory = await prisma.inventory.findMany({
      where: { product: { sellerId: seller.id } },
      include: {
        product: {
          select: { id: true, name: true, nameAr: true, sku: true, slug: true },
        },
      },
      orderBy: { quantity: "asc" },
    });

    return apiSuccess(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, SELLER_ROLES)) return apiError("Unauthorized", 401);

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth!.user.userId },
    });
    if (!seller) return apiError("Seller profile not found", 404);

    const { productId, quantity, lowStockAlert } = z.object({
      productId: z.string(),
      quantity: z.number().int().min(0).optional(),
      lowStockAlert: z.number().int().min(0).optional(),
    }).parse(await request.json());

    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId: seller.id },
    });
    if (!product) return apiError("Product not found", 404);

    const inventory = await prisma.inventory.update({
      where: { productId },
      data: {
        ...(quantity !== undefined ? { quantity } : {}),
        ...(lowStockAlert !== undefined ? { lowStockAlert } : {}),
      },
    });

    return apiSuccess(inventory);
  } catch (error) {
    return handleApiError(error);
  }
}
