import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  nameAr: z.string().min(3).max(200),
  description: z.string().min(10),
  descriptionAr: z.string().min(10),
  categoryId: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().min(3),
  codAvailable: z.boolean().default(true),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })).optional(),
  variants: z.array(z.object({
    name: z.string(),
    nameAr: z.string().optional(),
    sku: z.string(),
    price: z.number().positive().optional(),
    color: z.string().optional(),
    size: z.string().optional(),
    stock: z.number().int().min(0).default(0),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().min(10).max(2000),
});
