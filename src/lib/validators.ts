import { z } from "zod";

export const orderQuerySchema = z.object({
  query: z.string().min(1, "Please enter your email or order ID"),
});

export const purchaseSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  email: z.string().email("Invalid email address"),
  paymentMethod: z.enum(["stripe", "crypto"]),
});

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  categoryId: z.string().min(1),
  stockType: z.enum(["one_time", "repeatable"]),
  isActive: z.boolean().default(true),
});

export const cardImportSchema = z.object({
  productId: z.string().min(1),
  cards: z.array(z.string().min(1)).min(1, "At least one card is required"),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const settingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().max(500).optional(),
  seoMeta: z.string().max(200).optional(),
  announcement: z.string().max(1000).optional(),
  supportLink: z.string().url().optional().or(z.literal("")),
  customDomain: z.string().optional(),
});
