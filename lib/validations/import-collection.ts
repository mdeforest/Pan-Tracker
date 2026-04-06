import { z } from "zod"

const CATEGORIES = [
  "mascara",
  "cleanser",
  "serum",
  "moisturizer",
  "mist",
  "eye_cream",
  "toner",
  "miscellaneous",
] as const

export const collectionRowSchema = z.object({
  brand: z.string().max(100).default(""),
  name: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  sizeWeight: z.string().max(100).trim().nullable(),
  manufactureDate: z.string().trim().nullable(),
  dateInCollection: z.string().trim().nullable(),
  expirationDate: z.string().trim().nullable(),
  isFinished: z.boolean(),
})

export const wishlistRowSchema = z.object({
  brand: z.string().max(100).default(""),
  name: z.string().min(1).max(200),
})

export const importCollectionBodySchema = z
  .object({
    rows: z.array(collectionRowSchema).min(0).max(500),
    wishlistRows: z.array(wishlistRowSchema).max(200).optional().default([]),
  })
  .refine((data) => data.rows.length > 0 || data.wishlistRows.length > 0, {
    message: "Must include at least one product row or wishlist item",
  })

export type CollectionRow = z.infer<typeof collectionRowSchema>
export type WishlistImportRow = z.infer<typeof wishlistRowSchema>
export type ImportCollectionBody = z.infer<typeof importCollectionBodySchema>
