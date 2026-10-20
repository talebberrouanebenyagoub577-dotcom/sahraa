import { z } from "zod";

export const catalogImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const adminCreateProductSchema = z.object({
  name: z.string().min(3).max(200),
  nameAr: z.string().min(3).max(200),
  description: z.string().min(3),
  descriptionAr: z.string().min(3),
  categoryId: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().min(3),
  codAvailable: z.boolean().default(true),
  status: z.enum(["APPROVED", "DRAFT", "ARCHIVED"]).default("APPROVED"),
  quantity: z.number().int().min(0).default(0),
  images: z.array(catalogImageSchema).optional(),
  seoTitle: z.string().max(200).optional(),
  seoTitleAr: z.string().max(200).optional(),
  seoKeywords: z.array(z.string().max(80)).max(30).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isFlashDeal: z.boolean().optional(),
});
