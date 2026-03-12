import { revalidateTag } from "next/cache"

const REVALIDATE_PROFILE = "max"
const IMMEDIATE_EXPIRE = { expire: 0 } as const

export function panTabTag(userId: string) {
  return `tab:pan:${userId}`
}

export function statsTabTag(userId: string) {
  return `tab:stats:${userId}`
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

export function wishlistTabTag(userId: string) {
  return `tab:wishlist:${userId}`
}

export function revalidateForPanMutation(
  userId: string,
  params?: { year?: number; month?: number }
) {
  revalidateTag(panTabTag(userId), IMMEDIATE_EXPIRE)
  revalidateTag(productsTabTag(userId), IMMEDIATE_EXPIRE)

  if (params?.year !== undefined && params?.month !== undefined) {
    revalidateTag(panMonthTabTag(userId, params.year, params.month), IMMEDIATE_EXPIRE)
  }
}

export function revalidateForEmptiesMutation(
  userId: string,
  params?: { year?: number; month?: number }
) {
  revalidateTag(emptiesTabTag(userId), REVALIDATE_PROFILE)
  revalidateTag(statsTabTag(userId), REVALIDATE_PROFILE)
  revalidateForPanMutation(userId, params)
}

export function revalidateForProductMutation(userId: string) {
  revalidateTag(productsTabTag(userId), REVALIDATE_PROFILE)
  revalidateTag(panTabTag(userId), REVALIDATE_PROFILE)
  revalidateTag(emptiesTabTag(userId), REVALIDATE_PROFILE)
  revalidateTag(statsTabTag(userId), REVALIDATE_PROFILE)
  revalidateTag(wishlistTabTag(userId), REVALIDATE_PROFILE)
}

export function revalidateForWishlistMutation(userId: string) {
  revalidateTag(wishlistTabTag(userId), REVALIDATE_PROFILE)
}
