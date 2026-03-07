import { z } from "zod"

const WOULD_REPURCHASE = ["yes", "no", "maybe"] as const

export const CreateEmptySchema = z.object({
  pan_entry_id: z.string().uuid("Invalid pan entry ID"),
  rating: z.number().int().min(1).max(5).optional(),
  would_repurchase: z.enum(WOULD_REPURCHASE).optional(),
  review_notes: z.string().optional(),
  replacement_product_id: z.string().uuid().optional(),
  replacement_free_text: z.string().optional(),
})

export type CreateEmptyInput = z.infer<typeof CreateEmptySchema>
