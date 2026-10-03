import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { cacheDel } from "@/lib/redis";
import { z } from "zod";
import { ProductStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const status = new URL(request.url).searchParams.get("status") as ProductStatus | null;

    const products = await prisma.product.findMany({
      where: status ? { status } : { status: { in: ["PENDING_REVIEW", "REJECTED"] } },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { storeName: true, storeNameAr: true } },
        category: { select: { name: true, nameAr: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(products);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { productId, status } = z.object({
      productId: z.string(),
      status: z.nativeEnum(ProductStatus),
    }).parse(await request.json());

    const product = await prisma.product.update({
      where: { id: productId },
      data: { status },
    });

    await cacheDel("products:*");
    await prisma.auditLog.create({
      data: {
        userId: auth!.user.userId,
        action: "MODERATE_PRODUCT",
        entity: "Product",
        entityId: productId,
        details: { status },
      },
    });

    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}
