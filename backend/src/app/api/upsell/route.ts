import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { pickSmartUpsellSlug, UPSELL_CATALOG_META } from "@/lib/upsell";
import { UPSELL_SPECIAL_PRICE, PRODUCT_UNIT_PRICE } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartSlugsParam = searchParams.get("cartSlugs") || "";
    const cartProductIdsParam = searchParams.get("cartIds") || "";

    const cartSlugs = cartSlugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // If product IDs were sent, find their slugs
    if (cartProductIdsParam) {
      const ids = cartProductIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        const found = await prisma.product.findMany({
          where: { id: { in: ids } },
          select: { slug: true },
        });
        found.forEach((p) => {
          if (!cartSlugs.includes(p.slug)) cartSlugs.push(p.slug);
        });
      }
    }

    const targetSlug = pickSmartUpsellSlug(cartSlugs);

    const product = await prisma.product.findUnique({
      where: { slug: targetSlug },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });

    if (!product) {
      // Fallback to first available approved product
      const fallback = await prisma.product.findFirst({
        where: { status: "APPROVED" },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
      if (!fallback) return apiError("No upsell available", 404);

      return apiSuccess({
        id: fallback.id,
        slug: fallback.slug,
        name: fallback.name,
        nameAr: fallback.nameAr,
        image: fallback.images[0]?.url || "/placeholder.png",
        rating: fallback.rating || 4.9,
        reviewCount: fallback.reviewCount || 48,
        originalPrice: PRODUCT_UNIT_PRICE,
        upsellPrice: UPSELL_SPECIAL_PRICE,
        savings: PRODUCT_UNIT_PRICE - UPSELL_SPECIAL_PRICE,
        pitchAr: "عرض حصري لمرة واحدة مع طلبك الآن بـ 99 ر.س فقط وشحن مجاني مدمج.",
        pitchEn: "One-time exclusive order offer for only 99 SAR with free combined shipping.",
      });
    }

    const meta = UPSELL_CATALOG_META[product.slug] || {
      pitchAr: "عرض حصري لمرة واحدة مع طلبك الحالي بـ 99 ر.س فقط وشحن مجاني مدمج.",
      pitchEn: "One-time exclusive order offer for only 99 SAR with free combined shipping.",
    };

    return apiSuccess({
      id: product.id,
      slug: product.slug,
      name: product.name,
      nameAr: product.nameAr,
      image: product.images[0]?.url || "/placeholder.png",
      rating: product.rating || 4.9,
      reviewCount: product.reviewCount || 52,
      originalPrice: PRODUCT_UNIT_PRICE,
      upsellPrice: UPSELL_SPECIAL_PRICE,
      savings: PRODUCT_UNIT_PRICE - UPSELL_SPECIAL_PRICE,
      pitchAr: meta.pitchAr,
      pitchEn: meta.pitchEn,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
