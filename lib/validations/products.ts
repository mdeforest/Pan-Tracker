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
  brand: z.string().min(1, "Brand is required"),
  name: z.string().min(1, "Name is required"),
  category: z.enum(PRODUCT_CATEGORIES),
  notes: z.string().optional(),
  photo_url: z.string().url().nullable().optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
)

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
