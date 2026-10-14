import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { cacheDel } from "@/lib/redis";
import { slugify } from "@/lib/utils";
import { createProductSchema } from "@/lib/validations/product";
import { getPlatformSellerId } from "@/lib/admin/platform-seller";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const sellerId = await getPlatformSellerId();
    const status = new URL(request.url).searchParams.get("status") as ProductStatus | null;

    const products = await prisma.product.findMany({
      where: {
        sellerId,
        ...(status ? { status } : {}),
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        inventory: true,
        category: { select: { name: true, nameAr: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess(products);
  } catch (error) {
    return handleApiError(error);
  }
}

const adminCreateSchema = createProductSchema
  .omit({ images: true })
  .extend({
    images: z
      .array(z.object({ url: z.string().min(1), alt: z.string().optional() }))
      .optional(),
    status: z.enum(["APPROVED", "DRAFT", "ARCHIVED"]).default("APPROVED"),
    quantity: z.number().int().min(0).default(0),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isFlashDeal: z.boolean().optional(),
  });

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const body = await request.json();
    const data = adminCreateSchema.parse(body);
    const sellerId = await getPlatformSellerId();

    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId: data.categoryId,
        name: data.name,
        nameAr: data.nameAr,
        slug: `${slugify(data.name)}-${Date.now().toString(36)}`,
        description: data.description,
        descriptionAr: data.descriptionAr,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        sku: data.sku,
        codAvailable: data.codAvailable,
        status: data.status,
        isFeatured: data.isFeatured ?? false,
        isTrending: data.isTrending ?? false,
        isNewArrival: data.isNewArrival ?? false,
        isFlashDeal: data.isFlashDeal ?? false,
        images: data.images?.length
          ? {
              create: data.images.map((img, i) => ({
                url: img.url,
                alt: img.alt,
                isPrimary: i === 0,
                sortOrder: i,
              })),
            }
          : undefined,
        inventory: {
          create: {
            quantity: data.quantity,
          },
        },
      },
      include: { images: true, inventory: true, category: true },
    });

    await cacheDel("products:*");
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "CREATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        details: { source: "admin_catalog" },
      },
    });

    return apiSuccess(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
