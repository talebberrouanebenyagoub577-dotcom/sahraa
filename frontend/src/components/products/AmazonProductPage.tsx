import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import {
  BadgeCheck,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ProductActions } from "@/components/products/ProductActions";
import { WishlistButton } from "@/components/products/WishlistButton";
import { ProductShareButton } from "@/components/products/ProductShareButton";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductReviews } from "@/components/products/ProductReviews";
import { ProductCard } from "@/components/products/ProductCard";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";
import { ProductAssistant } from "@/components/ai/ProductAssistant";

type ProductPageData = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: true;
    category: true;
    seller: true;
    inventory: true;
    faqs: true;
    reviews: {
      include: {
        user: {
          select: {
            firstName: true;
            lastName: true;
            avatar: true;
          };
        };
      };
    };
  };
}>;

type EditorialMedia = {
  src: string;
  title: string;
  description: string;
  contain?: boolean;
};

type ProductCardData = {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  rating: number;
  reviewCount: number;
  codAvailable: boolean;
  isFlashDeal?: boolean;
  images?: { url: string }[];
  inventory?: { quantity: number } | null;
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-amber-400" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(rating) ? "" : "text-slate-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

export async function AmazonProductPage({
  product,
  related,
  moreFromSeller,
  sellerProductCount,
  ratingDistribution,
  locale,
  supportEmail,
  supportPhone,
}: {
  product: ProductPageData;
  related: ProductCardData[];
  moreFromSeller: ProductCardData[];
  sellerProductCount: number;
  ratingDistribution: { rating: number; count: number }[];
  locale: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
}) {
  const t = await getTranslations("product");
  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.name;
  const description = isArabic ? product.descriptionAr : product.description;
  const categoryName = isArabic
    ? product.category.nameAr
    : product.category.name;
  const sellerName = isArabic
    ? product.seller.storeNameAr || product.seller.storeName
    : product.seller.storeName;
  const stock = product.inventory?.quantity ?? 0;
  const inStock = stock > 0;
  const lowStockThreshold = product.inventory?.lowStockAlert ?? 5;
  const lowStock = inStock && stock <= lowStockThreshold;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : 0;
  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice - product.price
      : 0;

  const usageFaq = product.faqs.find(
    (faq) =>
      faq.question.toLowerCase().includes("how should i use") ||
      faq.questionAr?.includes("كيفية استعمال")
  );
  const audienceFaq = product.faqs.find(
    (faq) =>
      faq.question.toLowerCase().includes("who is this product") ||
      faq.questionAr?.includes("لمن يناسب")
  );
  const packageFaq = product.faqs.find(
    (faq) =>
      faq.question.toLowerCase().includes("included in the package") ||
      faq.questionAr?.includes("ماذا تحتوي")
  );
  const featuredFaqIds = new Set(
    [usageFaq?.id, audienceFaq?.id, packageFaq?.id].filter(Boolean)
  );
  const remainingFaqs = product.faqs.filter(
    (faq) => !featuredFaqIds.has(faq.id)
  );

  const colors = [
    ...new Set(product.variants.map((variant) => variant.color).filter(Boolean)),
  ];
  const sizes = [
    ...new Set(product.variants.map((variant) => variant.size).filter(Boolean)),
  ];
  const specifications = [
    { label: t("sku"), value: product.sku },
    { label: t("category"), value: categoryName },
    product.barcode
      ? { label: t("barcode"), value: product.barcode }
      : null,
    product.weight != null
      ? { label: t("weight"), value: String(product.weight) }
      : null,
    product.dimensions
      ? { label: t("dimensions"), value: product.dimensions }
      : null,
    colors.length > 0
      ? { label: t("colors"), value: colors.join(", ") }
      : null,
    sizes.length > 0 ? { label: t("sizes"), value: sizes.join(", ") } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const relatedIds = new Set(related.map((item) => item.id));
  const uniqueMoreFromSeller = moreFromSeller.filter(
    (item) => !relatedIds.has(item.id)
  );
  const editorialMedia: EditorialMedia[] =
    product.slug === "al-jabrut-assaoudi-50ml"
      ? [
          {
            src: "/products/al-jabrut-assaoudi-50ml/results.jpg",
            title: t("jabrutMedia.resultsTitle"),
            description: t("jabrutMedia.resultsDescription"),
          },
          {
            src: "/products/al-jabrut-assaoudi-50ml/usage-guide.jpg",
            title: t("jabrutMedia.usageTitle"),
            description: t("jabrutMedia.usageDescription"),
          },
          {
            src: "/products/al-jabrut-assaoudi-50ml/package.jpg",
            title: t("jabrutMedia.packageTitle"),
            description: t("jabrutMedia.packageDescription"),
          },
        ]
      : product.slug === "al-matthee-fun-math-game"
        ? [
            {
              src: "/products/al-matthee-fun-math-game/contents.jpg",
              title: t("mathGameMedia.contentsTitle"),
              description: t("mathGameMedia.contentsDescription"),
            },
            {
              src: "/products/al-matthee-fun-math-game/usage-guide.jpg",
              title: t("mathGameMedia.usageTitle"),
              description: t("mathGameMedia.usageDescription"),
            },
            {
              src: "/products/al-matthee-fun-math-game/individual-play.jpg",
              title: t("mathGameMedia.individualTitle"),
              description: t("mathGameMedia.individualDescription"),
            },
            {
              src: "/products/al-matthee-fun-math-game/group-play.jpg",
              title: t("mathGameMedia.groupTitle"),
              description: t("mathGameMedia.groupDescription"),
            },
          ]
      : product.slug === "capsicum-pain-relief-cream"
        ? [
            {
              src: "/products/capsicum-pain-relief-cream/product.jpg",
              title: t("capsicumMedia.productTitle"),
              description: t("capsicumMedia.productDescription"),
              contain: true,
            },
            {
              src: "/products/capsicum-pain-relief-cream/usage-guide.jpg",
              title: t("capsicumMedia.usageTitle"),
              description: t("capsicumMedia.usageDescription"),
              contain: true,
            },
            {
              src: "/products/capsicum-pain-relief-cream/before-after.jpg",
              title: t("capsicumMedia.beforeAfterTitle"),
              description: t("capsicumMedia.beforeAfterDescription"),
              contain: true,
            },
            {
              src: "/products/capsicum-pain-relief-cream/target-areas.jpg",
              title: t("capsicumMedia.areasTitle"),
              description: t("capsicumMedia.areasDescription"),
              contain: true,
            },
          ]
      : product.slug === "booty-gainer-pro-series"
        ? [
            {
              src: "/products/booty-gainer-pro-series/product.jpg",
              title: t("bootyGainerMedia.productTitle"),
              description: t("bootyGainerMedia.productDescription"),
            },
            {
              src: "/products/booty-gainer-pro-series/premium.jpg",
              title: t("bootyGainerMedia.premiumTitle"),
              description: t("bootyGainerMedia.premiumDescription"),
            },
            {
              src: "/products/booty-gainer-pro-series/lifestyle.jpg",
              title: t("bootyGainerMedia.lifestyleTitle"),
              description: t("bootyGainerMedia.lifestyleDescription"),
            },
            {
              src: "/products/booty-gainer-pro-series/results.jpg",
              title: t("bootyGainerMedia.resultsTitle"),
              description: t("bootyGainerMedia.resultsDescription"),
            },
            {
              src: "/products/booty-gainer-pro-series/usage-guide.jpg",
              title: t("bootyGainerMedia.usageTitle"),
              description: t("bootyGainerMedia.usageDescription"),
            },
          ]
      : product.slug === "dr-melaxin-peel-shot"
        ? [
            {
              src: "/products/dr-melaxin-peel-shot/product.jpg",
              title: t("melaxinMedia.productTitle"),
              description: t("melaxinMedia.productDescription"),
            },
            {
              src: "/products/dr-melaxin-peel-shot/salon.jpg",
              title: t("melaxinMedia.salonTitle"),
              description: t("melaxinMedia.salonDescription"),
            },
            {
              src: "/products/dr-melaxin-peel-shot/usage.jpg",
              title: t("melaxinMedia.usageTitle"),
              description: t("melaxinMedia.usageDescription"),
            },
            {
              src: "/products/dr-melaxin-peel-shot/before-after.jpg",
              title: t("melaxinMedia.beforeAfterTitle"),
              description: t("melaxinMedia.beforeAfterDescription"),
            },
          ]
      : product.slug === "al-asmad-alharmain-kohl"
        ? [
            {
              src: "/products/al-asmad-alharmain-kohl/product.jpg",
              title: t("alAsmadMedia.productTitle"),
              description: t("alAsmadMedia.productDescription"),
            },
            {
              src: "/products/al-asmad-alharmain-kohl/main.jpg",
              title: t("alAsmadMedia.mainTitle"),
              description: t("alAsmadMedia.mainDescription"),
            },
            {
              src: "/products/al-asmad-alharmain-kohl/lifestyle.jpg",
              title: t("alAsmadMedia.lifestyleTitle"),
              description: t("alAsmadMedia.lifestyleDescription"),
            },
            {
              src: "/products/al-asmad-alharmain-kohl/usage.jpg",
              title: t("alAsmadMedia.usageTitle"),
              description: t("alAsmadMedia.usageDescription"),
            },
            {
              src: "/products/al-asmad-alharmain-kohl/premium.jpg",
              title: t("alAsmadMedia.premiumTitle"),
              description: t("alAsmadMedia.premiumDescription"),
            },
            {
              src: "/products/al-asmad-alharmain-kohl/closeup.jpg",
              title: t("alAsmadMedia.closeupTitle"),
              description: t("alAsmadMedia.closeupDescription"),
            },
            {
              src: "/products/al-asmad-alharmain-kohl/commercial.jpg",
              title: t("alAsmadMedia.commercialTitle"),
              description: t("alAsmadMedia.commercialDescription"),
            },
          ]
      : product.slug === "eelhoe-hair-darkening-spray"
        ? [
            {
              src: "/products/eelhoe-hair-darkening-spray/product.jpg",
              title: t("eelhoeMedia.productTitle"),
              description: t("eelhoeMedia.productDescription"),
            },
            {
              src: "/products/eelhoe-hair-darkening-spray/premium.jpg",
              title: t("eelhoeMedia.premiumTitle"),
              description: t("eelhoeMedia.premiumDescription"),
            },
            {
              src: "/products/eelhoe-hair-darkening-spray/lifestyle.jpg",
              title: t("eelhoeMedia.lifestyleTitle"),
              description: t("eelhoeMedia.lifestyleDescription"),
            },
            {
              src: "/products/eelhoe-hair-darkening-spray/usage.jpg",
              title: t("eelhoeMedia.usageTitle"),
              description: t("eelhoeMedia.usageDescription"),
            },
            {
              src: "/products/eelhoe-hair-darkening-spray/before-after.jpg",
              title: t("eelhoeMedia.beforeAfterTitle"),
              description: t("eelhoeMedia.beforeAfterDescription"),
            },
            {
              src: "/products/eelhoe-hair-darkening-spray/instagram.jpg",
              title: t("eelhoeMedia.instagramTitle"),
              description: t("eelhoeMedia.instagramDescription"),
            },
            {
              src: "/products/eelhoe-hair-darkening-spray/tiktok.jpg",
              title: t("eelhoeMedia.tiktokTitle"),
              description: t("eelhoeMedia.tiktokDescription"),
            },
          ]
      : product.slug === "deep-cera-vitamin-illuminating-serum"
        ? [
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/product.jpg",
              title: t("deepCeraMedia.productTitle"),
              description: t("deepCeraMedia.productDescription"),
            },
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/beauty.jpg",
              title: t("deepCeraMedia.beautyTitle"),
              description: t("deepCeraMedia.beautyDescription"),
            },
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/ingredients.jpg",
              title: t("deepCeraMedia.ingredientsTitle"),
              description: t("deepCeraMedia.ingredientsDescription"),
            },
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/texture.jpg",
              title: t("deepCeraMedia.textureTitle"),
              description: t("deepCeraMedia.textureDescription"),
            },
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/routine.jpg",
              title: t("deepCeraMedia.routineTitle"),
              description: t("deepCeraMedia.routineDescription"),
            },
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/glow-routine.jpg",
              title: t("deepCeraMedia.glowRoutineTitle"),
              description: t("deepCeraMedia.glowRoutineDescription"),
            },
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/luxury.jpg",
              title: t("deepCeraMedia.luxuryTitle"),
              description: t("deepCeraMedia.luxuryDescription"),
            },
            {
              src: "/products/deep-cera-vitamin-illuminating-serum/fresh.jpg",
              title: t("deepCeraMedia.freshTitle"),
              description: t("deepCeraMedia.freshDescription"),
            },
          ]
      : product.slug === "hair-concealer-fuller-hair-look"
        ? [
            {
              src: "/products/hair-concealer-fuller-hair-look/product.jpg",
              title: t("hairConcealerMedia.productTitle"),
              description: t("hairConcealerMedia.productDescription"),
            },
            {
              src: "/products/hair-concealer-fuller-hair-look/lifestyle.jpg",
              title: t("hairConcealerMedia.lifestyleTitle"),
              description: t("hairConcealerMedia.lifestyleDescription"),
            },
            {
              src: "/products/hair-concealer-fuller-hair-look/usage.jpg",
              title: t("hairConcealerMedia.usageTitle"),
              description: t("hairConcealerMedia.usageDescription"),
            },
            {
              src: "/products/hair-concealer-fuller-hair-look/before-after.jpg",
              title: t("hairConcealerMedia.beforeAfterTitle"),
              description: t("hairConcealerMedia.beforeAfterDescription"),
            },
          ]
      : product.slug === "harvey-ross-instant-eye-lift"
        ? [
            {
              src: "/products/harvey-ross-instant-eye-lift/product.jpg",
              title: t("eyeLiftMedia.productTitle"),
              description: t("eyeLiftMedia.productDescription"),
            },
            {
              src: "/products/harvey-ross-instant-eye-lift/texture.jpg",
              title: t("eyeLiftMedia.textureTitle"),
              description: t("eyeLiftMedia.textureDescription"),
            },
            {
              src: "/products/harvey-ross-instant-eye-lift/usage-guide.jpg",
              title: t("eyeLiftMedia.usageTitle"),
              description: t("eyeLiftMedia.usageDescription"),
            },
            {
              src: "/products/harvey-ross-instant-eye-lift/before-after.jpg",
              title: t("eyeLiftMedia.beforeAfterTitle"),
              description: t("eyeLiftMedia.beforeAfterDescription"),
            },
          ]
      : product.slug === "car-battery-remote-disconnect-switch"
        ? [
            {
              src: "/products/car-battery-remote-disconnect-switch/main.jpg",
              title: t("batterySwitchMedia.mainTitle"),
              description: t("batterySwitchMedia.mainDescription"),
            },
            {
              src: "/products/car-battery-remote-disconnect-switch/features.jpg",
              title: t("batterySwitchMedia.featuresTitle"),
              description: t("batterySwitchMedia.featuresDescription"),
              contain: true,
            },
            {
              src: "/products/car-battery-remote-disconnect-switch/kit.jpg",
              title: t("batterySwitchMedia.kitTitle"),
              description: t("batterySwitchMedia.kitDescription"),
              contain: true,
            },
            {
              src: "/products/car-battery-remote-disconnect-switch/voltage-display.jpg",
              title: t("batterySwitchMedia.displayTitle"),
              description: t("batterySwitchMedia.displayDescription"),
              contain: true,
            },
            {
              src: "/products/car-battery-remote-disconnect-switch/manual.jpg",
              title: t("batterySwitchMedia.manualTitle"),
              description: t("batterySwitchMedia.manualDescription"),
              contain: true,
            },
            {
              src: "/products/car-battery-remote-disconnect-switch/wiring.jpg",
              title: t("batterySwitchMedia.wiringTitle"),
              description: t("batterySwitchMedia.wiringDescription"),
              contain: true,
            },
          ]
      : product.slug === "oswei-disposable-toilet-cleaning-wand"
        ? [
            {
              src: "/products/oswei-disposable-toilet-cleaning-wand/product.jpg",
              title: t("osweiMedia.productTitle"),
              description: t("osweiMedia.productDescription"),
            },
            {
              src: "/products/oswei-disposable-toilet-cleaning-wand/lifestyle.jpg",
              title: t("osweiMedia.lifestyleTitle"),
              description: t("osweiMedia.lifestyleDescription"),
            },
            {
              src: "/products/oswei-disposable-toilet-cleaning-wand/usage-guide.jpg",
              title: t("osweiMedia.usageTitle"),
              description: t("osweiMedia.usageDescription"),
            },
            {
              src: "/products/oswei-disposable-toilet-cleaning-wand/before-after.jpg",
              title: t("osweiMedia.beforeAfterTitle"),
              description: t("osweiMedia.beforeAfterDescription"),
            },
          ]
      : product.slug === "women-perfume-trio-la-vita-sbela-mi-way-ideal"
        ? [
            {
              src: "/products/women-perfume-trio-la-vita-sbela-mi-way-ideal/product.jpg",
              title: t("perfumeTrioMedia.productTitle"),
              description: t("perfumeTrioMedia.productDescription"),
            },
            {
              src: "/products/women-perfume-trio-la-vita-sbela-mi-way-ideal/collection.jpg",
              title: t("perfumeTrioMedia.collectionTitle"),
              description: t("perfumeTrioMedia.collectionDescription"),
            },
            {
              src: "/products/women-perfume-trio-la-vita-sbela-mi-way-ideal/la-vita-sbela.jpg",
              title: t("perfumeTrioMedia.laVitaTitle"),
              description: t("perfumeTrioMedia.laVitaDescription"),
            },
            {
              src: "/products/women-perfume-trio-la-vita-sbela-mi-way-ideal/notes.jpg",
              title: t("perfumeTrioMedia.notesTitle"),
              description: t("perfumeTrioMedia.notesDescription"),
            },
            {
              src: "/products/women-perfume-trio-la-vita-sbela-mi-way-ideal/lifestyle.jpg",
              title: t("perfumeTrioMedia.lifestyleTitle"),
              description: t("perfumeTrioMedia.lifestyleDescription"),
            },
          ]
      : product.slug === "ems-foot-massager-mat"
        ? [
            {
              src: "/products/ems-foot-massager-mat/product.jpg",
              title: t("emsFootMedia.productTitle"),
              description: t("emsFootMedia.productDescription"),
            },
            {
              src: "/products/ems-foot-massager-mat/lifestyle.jpg",
              title: t("emsFootMedia.lifestyleTitle"),
              description: t("emsFootMedia.lifestyleDescription"),
            },
            {
              src: "/products/ems-foot-massager-mat/controller.jpg",
              title: t("emsFootMedia.controllerTitle"),
              description: t("emsFootMedia.controllerDescription"),
            },
            {
              src: "/products/ems-foot-massager-mat/usage.jpg",
              title: t("emsFootMedia.usageTitle"),
              description: t("emsFootMedia.usageDescription"),
            },
          ]
      : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 lg:pb-12 lg:pt-8">
      <nav aria-label={t("breadcrumb")} className="mb-5 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-amber-500">
              {t("home")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/${locale}/categories/${product.category.slug}`}
              className="hover:text-amber-500"
            >
              {categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="max-w-full truncate font-medium text-slate-700">{name}</li>
        </ol>
      </nav>

      <section className="grid gap-8 lg:grid-cols-2 xl:gap-12">
        <div className="min-w-0">
          <ProductGallery
            images={product.images.map((image) => {
              const media = editorialMedia.find((item) => item.src === image.url);
              return media
                ? {
                    ...image,
                    alt: media.description,
                    captionTitle: media.title,
                    caption: media.description,
                  }
                : image;
            })}
            videoUrl={product.videoUrl}
            productName={name}
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categoryName}</Badge>
            {product.isNewArrival && (
              <Badge className="bg-sky-600 text-white">{t("newProductBadge")}</Badge>
            )}
            {product.isTrending && (
              <Badge className="bg-violet-600 text-white">{t("trendingBadge")}</Badge>
            )}
            {(product.isFlashDeal || discount > 0) && (
              <Badge className="bg-red-600 text-white">{t("saleBadge")}</Badge>
            )}
            {lowStock && (
              <Badge className="bg-orange-500 text-white">{t("limitedStockBadge")}</Badge>
            )}
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t("soldBy")}{" "}
                <span className="font-semibold text-amber-600">{sellerName}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <WishlistButton productId={product.id} />
              <ProductShareButton title={name} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href="#customer-reviews"
              className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <RatingStars rating={product.rating} />
              <span className="text-sm font-medium text-sky-600">
                {product.rating.toFixed(1)} · {product.reviewCount} {t("reviews")}
              </span>
            </a>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span className="text-sm text-slate-500">
              {t("sku")}: <bdi>{product.sku}</bdi>
            </span>
          </div>

          <div className="my-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {formatPrice(product.price, "SAR", locale)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-base text-slate-400 line-through">
                  {formatPrice(product.compareAtPrice, "SAR", locale)}
                </span>
              )}
              {discount > 0 && (
                <Badge className="bg-red-600 text-white">
                  {t("discount", { percent: discount })}
                </Badge>
              )}
            </div>
            {savings > 0 && (
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                {t("youSave", {
                  amount: formatPrice(savings, "SAR", locale),
                })}
              </p>
            )}
            <p className="mt-3 text-sm font-medium text-amber-800">{t("offerBody")}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                inStock ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <p
              className={`font-semibold ${
                inStock ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {inStock
                ? lowStock
                  ? t("onlyUnitsLeft", { count: stock })
                  : t("inStock")
                : t("outOfStock")}
            </p>
          </div>

          <ProductActions
            productId={product.id}
            productInfo={{
              name: product.name,
              nameAr: product.nameAr,
              slug: product.slug,
              image: product.images[0]?.url,
            }}
            variants={product.variants}
            inStock={inStock}
            inventoryQuantity={stock}
            basePrice={product.price}
            compareAtPrice={product.compareAtPrice}
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {product.codAvailable && (
              <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <CreditCard className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold">{t("codAvailable")}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {t("codExplanation")}
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
              <Truck className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-bold">{t("shippingInformation")}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {t("shippingCalculatedAtCheckout")}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-sky-500" />
              <p className="text-xs leading-5 text-slate-600">
                {t("secureCheckoutExplanation")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 border-t border-slate-200 pt-10">
        <h2 className="text-2xl font-bold">{t("productDetails")}</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <h3 className="text-lg font-bold">{t("description")}</h3>
            <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
              {description}
            </p>
            {packageFaq && (
              <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold">{t("packageContents")}</h3>
                </div>
                <p className="mt-3 leading-7 text-slate-600">
                  {isArabic
                    ? packageFaq.answerAr || packageFaq.answer
                    : packageFaq.answer}
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-lg font-bold">{t("specifications")}</h3>
            <dl className="overflow-hidden rounded-2xl border border-slate-200 text-sm">
              {specifications.map((specification, index) => (
                <div
                  key={specification.label}
                  className={`grid grid-cols-[minmax(110px,0.8fr)_1fr] gap-3 p-3 ${
                    index % 2 === 0 ? "bg-slate-50" : "bg-white"
                  }`}
                >
                  <dt className="font-semibold">{specification.label}</dt>
                  <dd className="break-words text-slate-600">
                    {specification.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {editorialMedia.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold">
            {product.slug === "ems-foot-massager-mat"
              ? t("emsFootMedia.sectionTitle")
              : product.slug === "women-perfume-trio-la-vita-sbela-mi-way-ideal"
              ? t("perfumeTrioMedia.sectionTitle")
              : product.slug === "oswei-disposable-toilet-cleaning-wand"
              ? t("osweiMedia.sectionTitle")
              : product.slug === "car-battery-remote-disconnect-switch"
              ? t("batterySwitchMedia.sectionTitle")
              : product.slug === "harvey-ross-instant-eye-lift"
              ? t("eyeLiftMedia.sectionTitle")
              : product.slug === "hair-concealer-fuller-hair-look"
              ? t("hairConcealerMedia.sectionTitle")
              : product.slug === "deep-cera-vitamin-illuminating-serum"
              ? t("deepCeraMedia.sectionTitle")
              : product.slug === "al-asmad-alharmain-kohl"
              ? t("alAsmadMedia.sectionTitle")
              : product.slug === "eelhoe-hair-darkening-spray"
              ? t("eelhoeMedia.sectionTitle")
              : product.slug === "dr-melaxin-peel-shot"
              ? t("melaxinMedia.sectionTitle")
              : product.slug === "booty-gainer-pro-series"
              ? t("bootyGainerMedia.sectionTitle")
              : product.slug === "capsicum-pain-relief-cream"
              ? t("capsicumMedia.sectionTitle")
              : product.slug === "al-matthee-fun-math-game"
                ? t("mathGameMedia.sectionTitle")
                : t("jabrutMedia.sectionTitle")}
          </h2>
          <div className="mt-6 space-y-6">
            {editorialMedia.map((media, index) => (
              <article
                key={media.src}
                className="grid items-center gap-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 md:p-6"
              >
                <div
                  className={`relative aspect-square overflow-hidden rounded-xl bg-slate-50 ${
                    index % 2 === 1 ? "md:order-2" : ""
                  }`}
                >
                  <Image
                    src={media.src}
                    alt={media.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={media.contain ? "object-contain" : "object-cover"}
                  />
                </div>
                <div className="px-1 py-2 md:px-5">
                  <h3 className="text-xl font-bold text-slate-900">{media.title}</h3>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-600">
                    {media.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {(usageFaq || audienceFaq) && (
        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {usageFaq && (
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500 p-2 text-slate-950">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">{t("howToUse")}</h2>
              </div>
              <p className="mt-4 leading-7 text-slate-700">
                {isArabic
                  ? usageFaq.answerAr || usageFaq.answer
                  : usageFaq.answer}
              </p>
            </article>
          )}
          {audienceFaq && (
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-600 p-2 text-white">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">{t("suitableFor")}</h2>
              </div>
              <p className="mt-4 leading-7 text-slate-700">
                {isArabic
                  ? audienceFaq.answerAr || audienceFaq.answer
                  : audienceFaq.answer}
              </p>
            </article>
          )}
        </section>
      )}

      {remainingFaqs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold">{t("faq")}</h2>
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {remainingFaqs.map((faq) => (
              <details key={faq.id} className="group bg-white p-5">
                <summary className="cursor-pointer list-none font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                  {isArabic ? faq.questionAr || faq.question : faq.question}
                </summary>
                <p className="mt-3 leading-7 text-slate-600">
                  {isArabic ? faq.answerAr || faq.answer : faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 grid gap-5 border-y border-slate-200 py-10 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-xl font-bold text-amber-700">
              {sellerName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{sellerName}</h2>
                {product.seller.status === "APPROVED" && (
                  <Badge variant="success">
                    <BadgeCheck className="me-1 h-3.5 w-3.5" />
                    {t("verifiedSeller")}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                {product.seller.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {product.seller.rating.toFixed(1)}
                  </span>
                )}
                <span>{t("sellerProductsCount", { count: sellerProductCount })}</span>
              </div>
              {(isArabic
                ? product.seller.descriptionAr || product.seller.description
                : product.seller.description) && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {isArabic
                    ? product.seller.descriptionAr || product.seller.description
                    : product.seller.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <CircleHelp className="h-6 w-6 text-amber-500" />
          <h2 className="mt-3 font-bold">{t("needProductHelp")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("supportDescription")}
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link
              href={`/${locale}/dashboard/customer/support`}
              className="font-semibold text-amber-600 hover:underline"
            >
              {t("contactSupport")}
            </Link>
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="text-slate-500 hover:underline">
                {supportEmail}
              </a>
            )}
            {supportPhone && (
              <a href={`tel:${supportPhone}`} className="text-slate-500 hover:underline">
                {supportPhone}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mt-12">
        <ProductReviews
          productId={product.id}
          initialReviews={product.reviews}
          initialDistribution={ratingDistribution}
          average={product.rating}
          total={product.reviewCount}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">{t("related")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {uniqueMoreFromSeller.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">
            {t("moreFromSeller", { seller: sellerName })}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {uniqueMoreFromSeller.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedSection productId={product.id} />
      <ProductAssistant
        productId={product.id}
        slug={product.slug}
        name={product.name}
        nameAr={product.nameAr}
        price={product.price}
        image={product.images[0]?.url}
      />
    </main>
  );
}
