import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { addressSchema } from "@/lib/validations/order";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const addresses = await prisma.address.findMany({
      where: { userId: auth.user.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return apiSuccess(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const data = addressSchema.parse(await request.json());

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: auth.user.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...data, userId: auth.user.userId },
    });
    return apiSuccess(address, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
