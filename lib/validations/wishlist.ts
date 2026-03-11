import { z } from "zod"

const WISHLIST_STATUSES = ["to_buy", "purchased", "all"] as const

const EstimatedPriceSchema = z
  .number()
  .finite("Estimated price must be a valid number")
  .min(0, "Estimated price cannot be negative")
  .max(99999.99, "Estimated price must be less than 100000")
  .transform((value) => Math.round(value * 100) / 100)

const OptionalEstimatedPriceSchema = z
  .union([EstimatedPriceSchema, z.null()])
  .optional()

export const ListWishlistSchema = z.object({
  status: z.enum(WISHLIST_STATUSES),
})

export const CreateWishlistItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID").nullable().optional(),
  brand: z.string().trim().min(1, "Brand is required").max(100, "Brand must be 100 characters or fewer"),
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be 200 characters or fewer"),
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").nullable().optional(),
  estimated_price: OptionalEstimatedPriceSchema,
})

export const UpdateWishlistItemSchema = z
  .object({
    product_id: z.string().uuid("Invalid product ID").nullable().optional(),
    brand: z.string().trim().min(1, "Brand is required").max(100, "Brand must be 100 characters or fewer").optional(),
    name: z.string().trim().min(1, "Name is required").max(200, "Name must be 200 characters or fewer").optional(),
    notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").nullable().optional(),
    estimated_price: OptionalEstimatedPriceSchema,
    purchased: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  })

export type WishlistStatusInput = z.infer<typeof ListWishlistSchema>
export type CreateWishlistItemInput = z.infer<typeof CreateWishlistItemSchema>
export type UpdateWishlistItemInput = z.infer<typeof UpdateWishlistItemSchema>
