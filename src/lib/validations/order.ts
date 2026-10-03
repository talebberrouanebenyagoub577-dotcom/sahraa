import { z } from "zod";
import { PaymentMethod, CountryCode } from "@prisma/client";

export const addressSchema = z.object({
  label: z.string().default("Home"),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  street: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.nativeEnum(CountryCode),
  isDefault: z.boolean().default(false),
});

const checkoutAddressSchema = z.object({
  label: z.string().default("Home"),
  firstName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  country: z.nativeEnum(CountryCode).default(CountryCode.SA),
});

export const checkoutSchema = z.object({
  shippingAddress: checkoutAddressSchema,
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
});
