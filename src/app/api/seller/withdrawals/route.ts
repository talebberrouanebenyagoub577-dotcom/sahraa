import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, SELLER_ROLES, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";
import { WithdrawalStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const isAdmin = requireRole(auth, ADMIN_ROLES);
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth.user.userId },
    });

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: isAdmin ? {} : { sellerId: seller?.id },
      include: { seller: { select: { storeName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(withdrawals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, SELLER_ROLES)) return apiError("Unauthorized", 401);

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth!.user.userId },
    });
    if (!seller || seller.status !== "APPROVED") {
      return apiError("Seller not approved", 403);
    }

    const { amount } = z.object({ amount: z.number().positive() }).parse(await request.json());

    const withdrawal = await prisma.withdrawalRequest.create({
      data: { sellerId: seller.id, amount },
    });

    return apiSuccess(withdrawal, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { id, status } = z.object({
      id: z.string(),
      status: z.nativeEnum(WithdrawalStatus),
    }).parse(await request.json());

    const withdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status },
    });

    return apiSuccess(withdrawal);
  } catch (error) {
    return handleApiError(error);
  }
}
