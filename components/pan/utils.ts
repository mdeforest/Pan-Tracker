import type { UsageLevel, ProductCategory } from "@/lib/types/app"

export const USAGE_LEVELS: UsageLevel[] = [
  "just_started",
  "quarter",
  "half",
  "three_quarters",
  "almost_done",
]

export const USAGE_PERCENT: Record<UsageLevel, number> = {
  just_started: 5,
  quarter: 25,
  half: 50,
  three_quarters: 75,
  almost_done: 95,
}

export const USAGE_LABELS: Record<UsageLevel, string> = {
  just_started: "Just Started",
  quarter: "Quarter",
  half: "Half",
  three_quarters: "¾ Done",
  almost_done: "Almost Done",
}

export function progressColor(pct: number): string {
  if (pct >= 75) return "bg-green-500"
  if (pct >= 30) return "bg-amber-500"
  return "bg-red-500"
}

export const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  makeup: "💄",
  skincare: "🧴",
  haircare: "💆",
  bodycare: "🧖",
  fragrance: "🌸",
  tools: "🪮",
  other: "✨",
}

export const CATEGORY_BG: Record<ProductCategory, string> = {
  makeup: "bg-pink-100",
  skincare: "bg-blue-100",
  haircare: "bg-purple-100",
  bodycare: "bg-orange-100",
  fragrance: "bg-yellow-100",
  tools: "bg-gray-100",
  other: "bg-teal-100",
}

export const CATEGORY_TEXT: Record<ProductCategory, string> = {
  makeup: "text-pink-600",
  skincare: "text-blue-600",
  haircare: "text-purple-600",
  bodycare: "text-orange-600",
  fragrance: "text-yellow-600",
  tools: "text-gray-600",
  other: "text-teal-600",
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  makeup: "Makeup",
  skincare: "Skincare",
  haircare: "Haircare",
  bodycare: "Bodycare",
  fragrance: "Fragrance",
  tools: "Tools",
  other: "Other",
}

export const ALL_CATEGORIES: ProductCategory[] = [
  "makeup",
  "skincare",
  "haircare",
  "bodycare",
  "fragrance",
  "tools",
  "other",
]

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/** Returns the number of full months between start and current view */
export function monthsInPan(
  startedMonth: number,
  startedYear: number,
  currentMonth: number,
  currentYear: number
): number {
  return (currentYear - startedYear) * 12 + (currentMonth - startedMonth)
}
