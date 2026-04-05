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

export const importCollectionBodySchema = z.object({
  rows: z.array(collectionRowSchema).min(1).max(500),
})

export type CollectionRow = z.infer<typeof collectionRowSchema>
export type ImportCollectionBody = z.infer<typeof importCollectionBodySchema>
