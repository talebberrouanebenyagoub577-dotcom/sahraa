import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { addressSchema } from "@/lib/validations/order";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: auth.user.userId },
    });
    if (!existing) return apiError("Address not found", 404);

    const data = addressSchema.partial().parse(await request.json());

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: auth.user.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({ where: { id }, data });
    return apiSuccess(address);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { id } = await params;
    const existing = await prisma.address.findFirst({
      where: { id, userId: auth.user.userId },
    });
    if (!existing) return apiError("Address not found", 404);

    await prisma.address.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
