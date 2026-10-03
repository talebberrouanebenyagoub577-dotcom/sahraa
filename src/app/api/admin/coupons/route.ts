import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  minOrderValue: z.number().optional(),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().int().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return apiSuccess(coupons);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const data = couponSchema.parse(await request.json());
    const coupon = await prisma.coupon.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    return apiSuccess(coupon, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { id, isActive } = z.object({
      id: z.string(),
      isActive: z.boolean(),
    }).parse(await request.json());

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive },
    });

    return apiSuccess(coupon);
  } catch (error) {
    return handleApiError(error);
  }
}
