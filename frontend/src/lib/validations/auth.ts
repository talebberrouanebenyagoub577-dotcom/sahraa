import { z } from "zod";
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().optional(),
  country: z.enum(["SA", "AE", "KW", "QA", "BH", "OM"]).default("SA"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SELLER", "CUSTOMER", "SUPPORT_AGENT"]).default("CUSTOMER"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  language: z.enum(["AR", "EN"]).optional(),
  country: z.enum(["SA", "AE", "KW", "QA", "BH", "OM"]).optional(),
});
