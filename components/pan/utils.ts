import type { UsageLevel, ProductCategory } from "@/lib/types/app"

export const USAGE_LEVELS: UsageLevel[] = [
  "just_started",
  "quarter",
  "half",
  "three_quarters",
  "almost_done",
]

export const USAGE_PERCENT: Record<UsageLevel, number> = {
  just_started: 100,
  quarter: 75,
  half: 50,
  three_quarters: 25,
  almost_done: 5,
}

export const USAGE_LABELS: Record<UsageLevel, string> = {
  just_started: "Full",
  quarter: "Three Quarters Left",
  half: "Half Full",
  three_quarters: "Low",
  almost_done: "Almost Empty",
}

export const USAGE_SHORT_LABELS: Record<UsageLevel, string> = {
  just_started: "Full",
  quarter: "3/4 Left",
  half: "Half",
  three_quarters: "Low",
  almost_done: "Almost Empty",
}

export function progressColor(pct: number): string {
  if (pct >= 75) return "bg-green-500"
  if (pct >= 30) return "bg-amber-500"
  return "bg-red-500"
}

export const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  mascara: "🖤",
  cleanser: "🫧",
  serum: "💧",
  moisturizer: "🧴",
  mist: "🌫️",
  eye_cream: "👁️",
  toner: "🌿",
  miscellaneous: "✨",
}

export const CATEGORY_BG: Record<ProductCategory, string> = {
  mascara: "bg-gray-100",
  cleanser: "bg-blue-100",
  serum: "bg-purple-100",
  moisturizer: "bg-pink-100",
  mist: "bg-sky-100",
  eye_cream: "bg-indigo-100",
  toner: "bg-green-100",
  miscellaneous: "bg-teal-100",
}

export const CATEGORY_TEXT: Record<ProductCategory, string> = {
  mascara: "text-gray-600",
  cleanser: "text-blue-600",
  serum: "text-purple-600",
  moisturizer: "text-pink-600",
  mist: "text-sky-600",
  eye_cream: "text-indigo-600",
  toner: "text-green-600",
  miscellaneous: "text-teal-600",
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  mascara: "Mascara",
  cleanser: "Cleanser",
  serum: "Serum",
  moisturizer: "Moisturizer",
  mist: "Mist",
  eye_cream: "Eye Cream",
  toner: "Toner",
  miscellaneous: "Miscellaneous",
}

export const ALL_CATEGORIES: ProductCategory[] = [
  "mascara",
  "cleanser",
  "serum",
  "moisturizer",
  "mist",
  "eye_cream",
  "toner",
  "miscellaneous",
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
