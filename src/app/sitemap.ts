import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  "",
  "/products",
  "/cart",
  "/checkout",
  "/wishlist",
  "/search",
  "/contact",
  "/about",
  "/terms",
  "/privacy",
  "/help",
  "/sell",
  "/auth/login",
  "/auth/register",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sahraa.com";

  const staticEntries = SUPPORTED_LOCALES.flatMap((locale) =>
    STATIC_PAGES.map((page) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: (page === "" ? "daily" : "weekly") as "daily" | "weekly",
      priority: page === "" ? 1 : 0.8,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar${page}`,
          en: `${baseUrl}/en${page}`,
        },
      },
    }))
  );

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: "APPROVED" },
      select: { slug: true, updatedAt: true },
    });

    productEntries = SUPPORTED_LOCALES.flatMap((locale) =>
      products.map((p) => ({
        url: `${baseUrl}/${locale}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: {
          languages: {
            ar: `${baseUrl}/ar/products/${p.slug}`,
            en: `${baseUrl}/en/products/${p.slug}`,
          },
        },
      }))
    );
  } catch {
    /* DB may not be available at build time */
  }

  return [...staticEntries, ...productEntries];
}
