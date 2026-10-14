import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { CheckCircle2, Star } from "lucide-react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { HomeOfferBanner } from "@/components/home/HomeOfferBanner";
import { ProductSection } from "@/components/home/ProductSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Newsletter } from "@/components/home/Newsletter";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackBanners = [
  {
    id: "1",
    title: "Shop Smart, Pay on Delivery",
    titleAr: "تسوق بذكاء، ادفع عند الاستلام",
    subtitle: "Best deals across the GCC",
    subtitleAr: "أفضل العروض في دول الخليج",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=450&fit=crop",
    link: null,
  },
];

async function getHomeData() {
  const productInclude = {
    images: { where: { isPrimary: true }, take: 1 },
    inventory: { select: { quantity: true } },
  };

  try {
  const [banners, categories, featured, trending, bestSellers, flashDeals, newArrivals] =
    await Promise.all([
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 5,
      }),
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        include: { _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
        take: 8,
      }),
      prisma.product.findMany({
        where: { status: "APPROVED", isFeatured: true },
        include: productInclude,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.product.findMany({
        where: { status: "APPROVED", isTrending: true },
        include: productInclude,
        take: 10,
      }),
      prisma.product.findMany({
        where: { status: "APPROVED" },
        include: productInclude,
        orderBy: { soldCount: "desc" },
        take: 10,
      }),
      prisma.product.findMany({
        where: { status: "APPROVED", isFlashDeal: true },
        include: productInclude,
        take: 10,
      }),
      prisma.product.findMany({
        where: { status: "APPROVED", isNewArrival: true },
        include: productInclude,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  let aiRecommended = trending;
  try {
    aiRecommended = await prisma.product.findMany({
      where: { status: "APPROVED" },
      include: productInclude,
      orderBy: { rating: "desc" },
      take: 10,
    });
  } catch {
    /* use trending as fallback */
  }

  const reviews = await prisma.review.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true } },
      product: { select: { name: true, nameAr: true, slug: true } },
    },
  });

  return {
    banners: banners.length ? banners : fallbackBanners,
    categories,
    featured,
    trending,
    bestSellers,
    flashDeals,
    newArrivals,
    aiRecommended,
    reviews,
  };
  } catch {
    return {
      banners: fallbackBanners,
      categories: [],
      featured: [],
      trending: [],
      bestSellers: [],
      flashDeals: [],
      newArrivals: [],
      aiRecommended: [],
      reviews: [],
    };
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const data = await getHomeData();

  return (
    <>
      <HomeOfferBanner />
      <HeroBanner banners={data.banners} />

      <CategoryGrid categories={data.categories} />

      <ProductSection
        title={t("flashDeals")}
        products={data.flashDeals}
        section="flashDeals"
        icon="⚡"
      />

      <div className="bg-white">
        <ProductSection
          title={t("featured")}
          products={data.featured}
          section="featured"
          icon="⭐"
        />
      </div>

      <ProductSection
        title={t("trending")}
        products={data.trending}
        section="trending"
        icon="🔥"
      />

      <div className="bg-white">
        <ProductSection
          title={t("bestSellers")}
          products={data.bestSellers}
          section="bestSellers"
          icon="🏆"
        />
      </div>

      <ProductSection
        title={t("newArrivals")}
        products={data.newArrivals}
        section="newArrivals"
        icon="✨"
      />

      <div className="bg-gradient-to-b from-amber-50 to-white">
        <ProductSection
          title={t("aiRecommended")}
          products={data.aiRecommended}
          section="aiRecommended"
          icon="🤖"
        />
      </div>

      {data.reviews.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50/70 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 text-center sm:text-start">
              <h2 className="text-xl font-bold text-slate-900 md:text-3xl">
                {t("reviews")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("reviewsSubtitle")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("verifiedBuyer")}
                      </span>
                    </div>

                    {review.title && (
                      <h3 className="mt-3 font-semibold text-slate-900 line-clamp-1">
                        {review.title}
                      </h3>
                    )}

                    <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {review.comment}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800">
                        {review.user.firstName} {review.user.lastName}
                      </span>
                      <Link
                        href={`/${locale}/products/${review.product.slug}`}
                        className="truncate text-amber-600 hover:text-amber-700 max-w-[160px]"
                      >
                        {locale === "ar"
                          ? review.product.nameAr
                          : review.product.name}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Newsletter />
    </>
  );
}
