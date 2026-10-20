import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { customerPhone, hideInternalNotes, returnInclude } from "@/lib/returns/include";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);
    const { id } = await params;
    const isAdmin = requireRole(auth, ADMIN_ROLES);

    const row = await prisma.returnRequest.findUnique({
      where: { id },
      include: returnInclude,
    });
    if (!row) return apiError("Return not found", 404);
    if (!isAdmin && row.userId !== auth.user.userId) return apiError("Forbidden", 403);

    return apiSuccess({
      ...hideInternalNotes(row, isAdmin),
      customerPhone: customerPhone(row.user, row.order.shippingAddress),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
