import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { publicUploadUrl } from "@/lib/uploads";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return apiError("No file provided", 400);
    if (!ALLOWED_TYPES.has(file.type)) return apiError("Invalid file type. Allowed: PNG, JPEG, WebP", 400);
    if (file.size > MAX_SIZE) return apiError("File too large. Maximum size is 5MB", 400);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "jpg";
    const filename = `return-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "returns");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

    return apiSuccess({ url: publicUploadUrl(request, `/uploads/returns/${filename}`) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
