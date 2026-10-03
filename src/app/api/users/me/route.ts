import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { updateProfileSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { getCurrencyForCountry } from "@/lib/utils";

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const data = updateProfileSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: auth.user.userId },
      data: {
        ...data,
        ...(data.country ? { currency: getCurrencyForCountry(data.country) } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        language: true,
        country: true,
        currency: true,
      },
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
