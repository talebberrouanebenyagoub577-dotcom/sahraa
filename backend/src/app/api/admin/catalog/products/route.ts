import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuth, requireAdmin } from "@/lib/auth/require-admin";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { cacheDel } from "@/lib/redis";
import { slugify } from "@/lib/utils";
import { getPlatformSellerId } from "@/lib/admin/platform-seller";
import { catalogImageRows } from "@/lib/admin/catalog-images";
import { adminCreateProductSchema } from "@/lib/admin/catalog-product-schema";
import { ProductStatus, type Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const sellerId = await getPlatformSellerId();
    const params = new URL(request.url).searchParams;
    const status = params.get("status") as ProductStatus | null;
    const categoryId = params.get("categoryId")?.trim() || null;
    const q = params.get("q")?.trim() || null;

    const where: Prisma.ProductWhereInput = {
      sellerId,
      ...(status && Object.values(ProductStatus).includes(status) ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { nameAr: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        inventory: true,
        category: { select: { id: true, name: true, nameAr: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess(products);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const body = await request.json();
    const data = adminCreateProductSchema.parse(body);
    const sellerId = await getPlatformSellerId();
    const imageRows = data.images?.length ? catalogImageRows(data.images) : undefined;

    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId: data.categoryId,
        name: data.name,
        nameAr: data.nameAr,
        slug: `${slugify(data.name)}-${Date.now().toString(36)}`,
        description: data.description,
        descriptionAr: data.descriptionAr,
        seoTitle: data.seoTitle,
        seoTitleAr: data.seoTitleAr,
        seoKeywords: data.seoKeywords ?? [],
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        sku: data.sku,
        codAvailable: data.codAvailable,
        status: data.status,
        isFeatured: data.isFeatured ?? data.status === "APPROVED",
        isTrending: data.isTrending ?? false,
        isNewArrival: data.isNewArrival ?? data.status === "APPROVED",
        isFlashDeal: data.isFlashDeal ?? false,
        images: imageRows?.length ? { create: imageRows } : undefined,
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
