import { apiSuccess, handleApiError } from "@/lib/api/response";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "APPROVED" },
      select: { slug: true, updatedAt: true },
    });
    return apiSuccess({ products });
  } catch (error) {
    return handleApiError(error);
  }
}
