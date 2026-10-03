import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getCrossSellProducts } from "@/lib/ai/recommendations";
import { getSiteBaseUrl, getSiteSettings } from "@/lib/settings";
import { AmazonProductPage } from "@/components/products/AmazonProductPage";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: {
    where: { isActive: true },
    orderBy: { name: "asc" as const },
  },
  category: true,
  seller: true,
  inventory: true,
  faqs: { orderBy: { sortOrder: "asc" as const } },
  reviews: {
    take: 6,
    orderBy: { createdAt: "desc" as const },
    include: {
      user: { select: { firstName: true, lastName: true, avatar: true } },
    },
  },
};

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug),
    getSiteSettings(),
  ]);

  if (!product || product.status !== "APPROVED") {
    return { title: locale === "ar" ? "المنتج غير موجود" : "Product not found" };
  }

  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.name;
  const title = isArabic
    ? product.seoTitleAr || product.nameAr
    : product.seoTitle || product.name;
  const description = (isArabic
    ? product.descriptionAr
    : product.description
  ).slice(0, 160);
  const baseUrl = getSiteBaseUrl(settings);
  const canonical = `${baseUrl}/${locale}/products/${product.slug}`;
  const images = product.images.map((image) => ({
    url: image.url,
    alt: image.alt || name,
  }));

  return {
    title,
    description,
    keywords: product.seoKeywords,
    alternates: {
      canonical,
      languages: {
        ar: `${baseUrl}/ar/products/${product.slug}`,
        en: `${baseUrl}/en/products/${product.slug}`,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: settings.siteName,
      locale: isArabic ? "ar_SA" : "en_US",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const product = await getProduct(slug);
  if (!product || product.status !== "APPROVED") notFound();

  const [related, moreFromSeller, reviewGroups, sellerProductCount, settings] =
    await Promise.all([
      getCrossSellProducts(product.id, 5),
      prisma.product.findMany({
        where: {
          sellerId: product.sellerId,
          status: "APPROVED",
          id: { not: product.id },
        },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          inventory: { select: { quantity: true } },
        },
        orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId: product.id },
        _count: { _all: true },
      }),
      prisma.product.count({
        where: { sellerId: product.sellerId, status: "APPROVED" },
      }),
      getSiteSettings(),
    ]);

  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.name;
  const description = isArabic
    ? product.descriptionAr
    : product.description;
  const inStock = (product.inventory?.quantity ?? 0) > 0;
  const baseUrl = getSiteBaseUrl(settings);
  const productUrl = `${baseUrl}/${locale}/products/${product.slug}`;
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count:
      reviewGroups.find((group) => group.rating === rating)?._count._all ?? 0,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: product.images.map((image) => image.url),
    sku: product.sku,
    url: productUrl,
    category: isArabic ? product.category.nameAr : product.category.name,
    ...(product.barcode ? { gtin: product.barcode } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: product.price,
      priceCurrency: "SAR",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: isArabic
          ? product.seller.storeNameAr || product.seller.storeName
          : product.seller.storeName,
      },
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AmazonProductPage
        product={product}
        related={related}
        moreFromSeller={moreFromSeller}
        sellerProductCount={sellerProductCount}
        ratingDistribution={ratingDistribution}
        locale={locale}
        supportEmail={settings.supportEmail}
        supportPhone={settings.supportPhone}
      />
    </>
  );
}
