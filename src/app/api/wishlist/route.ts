import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const productId = new URL(request.url).searchParams.get("productId");
    if (productId) {
      const item = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: { userId: auth.user.userId, productId },
        },
        select: { id: true },
      });
      return apiSuccess({ active: Boolean(item) });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: auth.user.userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            inventory: { select: { quantity: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { productId } = z.object({ productId: z.string() }).parse(
      await request.json()
    );

    const product = await prisma.product.findFirst({
      where: { id: productId, status: "APPROVED" },
      select: { id: true },
    });
    if (!product) return apiError("Product not found", 404);

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: { userId: auth.user.userId, productId },
      },
      update: {},
      create: { userId: auth.user.userId, productId },
    });

    return apiSuccess(item, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const productId = new URL(request.url).searchParams.get("productId");
    if (!productId) return apiError("Product ID required", 400);

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: { userId: auth.user.userId, productId },
      },
    });

    return apiSuccess({ removed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
