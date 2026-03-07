import type { Database } from "@/lib/types/database"

export type PanEntryRow = Database["public"]["Tables"]["pan_entries"]["Row"]
export type ProductRow = Database["public"]["Tables"]["products"]["Row"]

// Pan entry with joined product and is_pick flag
export type PanEntryWithProduct = PanEntryRow & {
  // Supabase returns the joined row as a single object (nullable due to isOneToOne: false in types)
  products: ProductRow | null
  is_pick: boolean
}
