import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) {
      return apiError("Unauthorized", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type");

    if (!(file instanceof File)) {
      return apiError("No file provided", 400);
    }

    if (type !== "logo" && type !== "favicon") {
      return apiError("Invalid upload type. Use 'logo' or 'favicon'", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return apiError("Invalid file type. Allowed: PNG, JPEG, WebP, SVG, ICO", 400);
    }

    if (file.size > MAX_SIZE) {
      return apiError("File too large. Maximum size is 2MB", 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeExt = ["png", "jpg", "jpeg", "webp", "svg", "ico"].includes(ext) ? ext : "png";
    const filename = `${type}-${Date.now()}.${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "settings");

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/settings/${filename}`;
    return apiSuccess({ url, type }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
