import { z } from "zod"

const WOULD_REPURCHASE = ["yes", "no", "maybe"] as const

export const CreateEmptySchema = z.object({
  pan_entry_id: z.string().uuid("Invalid pan entry ID"),
  rating: z.number().int().min(1).max(5).optional(),
  would_repurchase: z.enum(WOULD_REPURCHASE).optional(),
  review_notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").optional(),
  replacement_product_id: z.string().uuid().optional(),
  replacement_free_text: z.string().trim().max(200, "Replacement text must be 200 characters or fewer").optional(),
})

export type CreateEmptyInput = z.infer<typeof CreateEmptySchema>
