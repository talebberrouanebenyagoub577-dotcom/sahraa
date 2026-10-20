import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminAuth, requireAdmin } from "@/lib/auth/require-admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { cacheDel } from "@/lib/redis";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  nameAr: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  descriptionAr: z.string().max(2000).nullable().optional(),
  image: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return apiError("Category not found", 404);

    const data = updateCategorySchema.parse(await request.json());
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    await cacheDel("categories:*");
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "UPDATE_CATEGORY",
        entity: "Category",
        entityId: id,
        details: { source: "admin_catalog" },
      },
    });

    return apiSuccess(category);
  } catch (error) {
    return handleApiError(error);
  }
}
