import { NextRequest } from "next/server";
import { ReturnStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isAdminAuth, requireAdmin } from "@/lib/auth/require-admin";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { customerPhone, returnInclude } from "@/lib/returns/include";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    const params = new URL(request.url).searchParams;
    const status = params.get("status") as ReturnStatus | null;
    const q = params.get("q")?.trim() || "";
    const from = params.get("from");
    const to = params.get("to");

    const createdAt =
      from || to
        ? {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          }
        : undefined;

    const rows = await prisma.returnRequest.findMany({
      where: {
        ...(status && Object.values(ReturnStatus).includes(status) ? { status } : {}),
        ...(createdAt ? { createdAt } : {}),
        ...(q
          ? {
              OR: [
                { order: { orderNumber: { contains: q, mode: "insensitive" } } },
                { user: { firstName: { contains: q, mode: "insensitive" } } },
                { user: { lastName: { contains: q, mode: "insensitive" } } },
                { user: { phone: { contains: q, mode: "insensitive" } } },
                { reason: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: returnInclude,
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(
      rows.map((row) => ({
        ...row,
        customerName: `${row.user.firstName} ${row.user.lastName}`.trim(),
        customerPhone: customerPhone(row.user, row.order.shippingAddress),
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
