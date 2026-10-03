import { setRequestLocale, getTranslations } from "next-intl/server";
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
      product: { select: { name: true, nameAr: true } },
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
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-xl font-bold md:text-2xl">{t("reviews")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {data.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-2 flex text-amber-400">
                    {"★".repeat(review.rating)}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {review.comment}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-900">
                    {review.user.firstName} {review.user.lastName}
                  </p>
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
