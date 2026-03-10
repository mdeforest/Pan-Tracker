import { z } from "zod"

export const ListPicksSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(9999),
})

export const SetPicksSchema = z.object({
  pan_entry_ids: z.array(z.string().uuid("Invalid pan entry ID")),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(9999),
})

export type ListPicksInput = z.infer<typeof ListPicksSchema>
export type SetPicksInput = z.infer<typeof SetPicksSchema>
