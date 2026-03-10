import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns a zero-padded month string, e.g. 3 -> "03" */
export function padMonth(month: number): string {
  return String(month).padStart(2, "0")
}

/** Returns current year and month as { year, month } */
export function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback: string
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback
  }

  return next
}
