import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { cacheDel } from "@/lib/redis";
import { getPlatformSellerId } from "@/lib/admin/platform-seller";
import { updateProductSchema } from "@/lib/validations/product";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const adminUpdateSchema = updateProductSchema
  .omit({ images: true })
  .extend({
    status: z.nativeEnum(ProductStatus).optional(),
    quantity: z.number().int().min(0).optional(),
    images: z
      .array(z.object({ url: z.string().min(1), alt: z.string().optional() }))
      .optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isFlashDeal: z.boolean().optional(),
  });

async function assertPlatformProduct(id: string, sellerId: string) {
  const product = await prisma.product.findFirst({
    where: { id, sellerId },
    include: { images: true, inventory: true },
  });
  if (!product) return null;
  return product;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { id } = await params;
    const sellerId = await getPlatformSellerId();
    const product = await assertPlatformProduct(id, sellerId);
    if (!product) return apiError("Product not found", 404);

    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { id } = await params;
    const sellerId = await getPlatformSellerId();
    const existing = await assertPlatformProduct(id, sellerId);
    if (!existing) return apiError("Product not found", 404);

    const data = adminUpdateSchema.parse(await request.json());

    const product = await prisma.$transaction(async (tx) => {
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: data.images.map((img, i) => ({
            productId: id,
            url: img.url,
            alt: img.alt,
            isPrimary: i === 0,
            sortOrder: i,
          })),
        });
      }

      if (data.quantity !== undefined) {
        await tx.inventory.upsert({
          where: { productId: id },
          create: { productId: id, quantity: data.quantity },
          update: { quantity: data.quantity },
        });
      }

      const {
        images: _images,
        quantity: _qty,
        variants: _variants,
        categoryId,
        ...fields
      } = data;

      return tx.product.update({
        where: { id },
        data: {
          ...fields,
          ...(categoryId
            ? { category: { connect: { id: categoryId } } }
            : {}),
        },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          inventory: true,
          category: true,
        },
      });
    });

    await cacheDel("products:*");
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: id,
        details: { source: "admin_catalog" },
      },
    });

    return apiSuccess(product);
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
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { id } = await params;
    const sellerId = await getPlatformSellerId();
    const existing = await assertPlatformProduct(id, sellerId);
    if (!existing) return apiError("Product not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { productId: id } });
      await tx.wishlistItem.deleteMany({ where: { productId: id } });
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    await cacheDel("products:*");
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "DELETE_PRODUCT",
        entity: "Product",
        entityId: id,
        details: { source: "admin_catalog" },
      },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
