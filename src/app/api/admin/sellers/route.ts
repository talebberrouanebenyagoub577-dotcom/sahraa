import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";
import { SellerStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const status = new URL(request.url).searchParams.get("status") as SellerStatus | null;

    const sellers = await prisma.sellerProfile.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(sellers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { sellerId, status } = z.object({
      sellerId: z.string(),
      status: z.nativeEnum(SellerStatus),
    }).parse(await request.json());

    const seller = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        status,
        ...(status === "APPROVED" ? { approvedAt: new Date() } : {}),
      },
    });

    if (status === "APPROVED") {
      await prisma.user.update({
        where: { id: seller.userId },
        data: { role: "SELLER" },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: auth!.user.userId,
        action: "UPDATE_SELLER",
        entity: "SellerProfile",
        entityId: sellerId,
        details: { status },
      },
    });

    return apiSuccess(seller);
  } catch (error) {
    return handleApiError(error);
  }
}
