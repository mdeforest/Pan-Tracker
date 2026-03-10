import { z } from "zod"

const USAGE_LEVELS = [
  "just_started",
  "quarter",
  "half",
  "three_quarters",
  "almost_done",
] as const

const PAN_ENTRY_STATUSES = ["active", "empty", "paused"] as const

export const AddToPanSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
})

export const UpdatePanEntrySchema = z
  .object({
    usage_level: z.enum(USAGE_LEVELS).optional(),
    notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").nullable().optional(),
    status: z.enum(PAN_ENTRY_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).some((k) => data[k as keyof typeof data] !== undefined), {
    message: "At least one field must be provided",
  })

export const CarryOverSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1, "At least one product ID required"),
})

export type AddToPanInput = z.infer<typeof AddToPanSchema>
export type UpdatePanEntryInput = z.infer<typeof UpdatePanEntrySchema>
export type CarryOverInput = z.infer<typeof CarryOverSchema>
