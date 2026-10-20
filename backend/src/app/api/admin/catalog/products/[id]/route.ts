import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuth, requireAdmin } from "@/lib/auth/require-admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { cacheDel } from "@/lib/redis";
import { getPlatformSellerId } from "@/lib/admin/platform-seller";
import { catalogImageRows } from "@/lib/admin/catalog-images";
import { updateProductSchema } from "@/lib/validations/product";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const adminUpdateSchema = updateProductSchema
  .omit({ images: true })
  .extend({
    status: z.nativeEnum(ProductStatus).optional(),
    quantity: z.number().int().min(0).optional(),
    seoTitle: z.string().max(200).nullable().optional(),
    seoTitleAr: z.string().max(200).nullable().optional(),
    seoKeywords: z.array(z.string().max(80)).max(30).optional(),
    images: z
      .array(
        z.object({
          url: z.string().min(1),
          alt: z.string().optional(),
          isPrimary: z.boolean().optional(),
        }),
      )
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
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

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
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const { id } = await params;
    const sellerId = await getPlatformSellerId();
    const existing = await assertPlatformProduct(id, sellerId);
    if (!existing) return apiError("Product not found", 404);

    const data = adminUpdateSchema.parse(await request.json());

    const product = await prisma.$transaction(async (tx) => {
      if (data.images) {
        const imageRows = catalogImageRows(data.images);
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: imageRows.map((img) => ({
            productId: id,
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
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
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

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
