import { NextRequest } from "next/server";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logOrderError, parsePageLimit } from "@/lib/orders/admin-view";
import { loadOrderList } from "@/lib/orders/list";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePageLimit(searchParams, 50);

    const payload = await loadOrderList({
      isAdmin: true,
      userId: auth.user.userId,
      page,
      limit,
      status: searchParams.get("status"),
    });

    return apiSuccess(payload);
  } catch (error) {
    logOrderError("admin-list", error);
    return handleApiError(error);
  }
}
