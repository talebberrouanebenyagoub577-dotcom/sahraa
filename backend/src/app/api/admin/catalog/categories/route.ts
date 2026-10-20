import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuth, requireAdmin } from "@/lib/auth/require-admin";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { cacheDel } from "@/lib/redis";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(2).max(120),
  nameAr: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  descriptionAr: z.string().max(2000).optional(),
  image: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
    });

    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const data = createCategorySchema.parse(await request.json());
    const slug = data.slug?.trim() || `${slugify(data.name)}-${Date.now().toString(36)}`;

    const category = await prisma.category.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        slug,
        description: data.description,
        descriptionAr: data.descriptionAr,
        image: data.image,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await cacheDel("categories:*");
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "CREATE_CATEGORY",
        entity: "Category",
        entityId: category.id,
        details: { source: "admin_catalog" },
      },
    });

    return apiSuccess(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
