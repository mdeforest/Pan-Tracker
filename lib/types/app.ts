// App-level types and enums

export type ProductCategory =
  | "makeup"
  | "skincare"
  | "haircare"
  | "bodycare"
  | "fragrance"
  | "tools"
  | "other"

export type PanEntryStatus = "active" | "empty" | "paused"

export type UsageLevel =
  | "just_started"
  | "quarter"
  | "half"
  | "three_quarters"
  | "almost_done"

export type WouldRepurchase = "yes" | "no" | "maybe"

// API response envelope
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }
