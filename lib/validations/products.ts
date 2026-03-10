import { z } from "zod"

const PRODUCT_CATEGORIES = [
  "makeup",
  "skincare",
  "haircare",
  "bodycare",
  "fragrance",
  "tools",
  "other",
] as const

export const CreateProductSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required").max(100, "Brand must be 100 characters or fewer"),
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be 200 characters or fewer"),
  category: z.enum(PRODUCT_CATEGORIES),
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
)

export const RestoreProductSchema = z.object({
  restore: z.literal(true),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type RestoreProductInput = z.infer<typeof RestoreProductSchema>
