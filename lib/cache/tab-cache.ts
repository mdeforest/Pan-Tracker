import { revalidateTag } from "next/cache"

export function panTabTag(userId: string) {
  return `tab:pan:${userId}`
}

export function panMonthTabTag(userId: string, year: number, month: number) {
  return `tab:pan:${userId}:${year}:${month}`
}

export function productsTabTag(userId: string) {
  return `tab:products:${userId}`
}

export function emptiesTabTag(userId: string) {
  return `tab:empties:${userId}`
}

export function revalidateForPanMutation(
  userId: string,
  params?: { year?: number; month?: number }
) {
  revalidateTag(panTabTag(userId))
  revalidateTag(productsTabTag(userId))

  if (params?.year !== undefined && params?.month !== undefined) {
    revalidateTag(panMonthTabTag(userId, params.year, params.month))
  }
}

export function revalidateForEmptiesMutation(
  userId: string,
  params?: { year?: number; month?: number }
) {
  revalidateTag(emptiesTabTag(userId))
  revalidateForPanMutation(userId, params)
}

export function revalidateForProductMutation(userId: string) {
  revalidateTag(productsTabTag(userId))
  revalidateTag(panTabTag(userId))
  revalidateTag(emptiesTabTag(userId))
}
