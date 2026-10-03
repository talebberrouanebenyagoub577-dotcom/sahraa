import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { getSiteSettings, serializeSiteSettings } from "@/lib/settings";
import { updateSiteSettingsSchema } from "@/lib/settings/validation";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return apiSuccess(serializeSiteSettings(settings));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const data = updateSiteSettingsSchema.parse(body);

    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        ...data,
        updatedBy: auth.user.userId,
      },
      create: {
        id: "default",
        ...data,
        updatedBy: auth.user.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "UPDATE",
        entity: "SiteSettings",
        entityId: "default",
        details: { fields: Object.keys(data) },
      },
    });

    return apiSuccess(serializeSiteSettings(settings));
  } catch (error) {
    return handleApiError(error);
  }
}
