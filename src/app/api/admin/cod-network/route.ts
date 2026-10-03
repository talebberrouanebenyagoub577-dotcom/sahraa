import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";
import { CountryCode } from "@prisma/client";

const supplierSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.nativeEnum(CountryCode),
});

const codOfferSchema = z.object({
  supplierId: z.string(),
  title: z.string().min(2),
  titleAr: z.string().optional(),
  commissionRate: z.number().min(0).max(100),
  countries: z.array(z.nativeEnum(CountryCode)),
  minOrderValue: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const [suppliers, offers, commissions] = await Promise.all([
      prisma.supplier.findMany({
        include: { _count: { select: { codOffers: true, commissions: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cODOffer.findMany({
        include: { supplier: { select: { name: true, nameAr: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.commission.findMany({
        include: {
          order: { select: { orderNumber: true, total: true } },
          supplier: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const totalCommissions = await prisma.commission.aggregate({
      _sum: { amount: true },
      where: { status: "EARNED" },
    });

    return apiSuccess({
      suppliers,
      offers,
      commissions,
      totalEarned: totalCommissions._sum.amount || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const body = await request.json();
    const type = body.type as string;

    if (type === "supplier") {
      const data = supplierSchema.parse(body);
      const supplier = await prisma.supplier.create({ data });

      await prisma.auditLog.create({
        data: {
          userId: auth!.user.userId,
          action: "CREATE_SUPPLIER",
          entity: "Supplier",
          entityId: supplier.id,
          details: { name: data.name },
        },
      });

      return apiSuccess(supplier, 201);
    }

    if (type === "offer") {
      const data = codOfferSchema.parse(body);
      const offer = await prisma.cODOffer.create({ data });

      await prisma.auditLog.create({
        data: {
          userId: auth!.user.userId,
          action: "CREATE_COD_OFFER",
          entity: "CODOffer",
          entityId: offer.id,
        },
      });

      return apiSuccess(offer, 201);
    }

    return apiError("Invalid type", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
