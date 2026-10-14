import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        language: true,
        country: true,
        currency: true,
        twoFactorEnabled: true,
        sellerProfile: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    if (!user) return apiError("User not found", 404);
    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
