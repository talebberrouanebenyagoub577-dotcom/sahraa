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

    const status = new URL(request.url).searchParams.get("status");

    const items = await prisma.orderItem.findMany({
      where: {
        sellerId: seller.id,
        ...(status ? { order: { status: status as never } } : {}),
      },
      include: {
        order: {
          select: {
            id: true, orderNumber: true, status: true, paymentMethod: true,
            createdAt: true, shippingAddress: true,
            user: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    return apiSuccess(items);
  } catch (error) {
    return handleApiError(error);
  }
}
