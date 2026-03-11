import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from "next/cache"
import {
  emptiesTabTag,
  panMonthTabTag,
  panTabTag,
  productsTabTag,
  revalidateForEmptiesMutation,
  revalidateForPanMutation,
  revalidateForProductMutation,
  revalidateForWishlistMutation,
  wishlistTabTag,
} from "@/lib/cache/tab-cache"

const USER_ID = "user-111"
const REVALIDATE_PROFILE = "max"

describe("tab cache tag helpers", () => {
  it("builds stable tab tags", () => {
    expect(panTabTag(USER_ID)).toBe("tab:pan:user-111")
    expect(panMonthTabTag(USER_ID, 2026, 3)).toBe("tab:pan:user-111:2026:3")
    expect(productsTabTag(USER_ID)).toBe("tab:products:user-111")
    expect(emptiesTabTag(USER_ID)).toBe("tab:empties:user-111")
    expect(wishlistTabTag(USER_ID)).toBe("tab:wishlist:user-111")
  })
})

describe("tab cache invalidation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("revalidates pan + products and an optional month tag", () => {
    revalidateForPanMutation(USER_ID, { year: 2026, month: 3 })

    expect(revalidateTag).toHaveBeenCalledWith("tab:pan:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:products:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:pan:user-111:2026:3", REVALIDATE_PROFILE)
  })

  it("revalidates empties, pan, and products for empties mutations", () => {
    revalidateForEmptiesMutation(USER_ID, { year: 2026, month: 3 })

    expect(revalidateTag).toHaveBeenCalledWith("tab:empties:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:pan:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:products:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:pan:user-111:2026:3", REVALIDATE_PROFILE)
  })

  it("revalidates all tab roots for product mutations", () => {
    revalidateForProductMutation(USER_ID)

    expect(revalidateTag).toHaveBeenCalledWith("tab:products:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:pan:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:empties:user-111", REVALIDATE_PROFILE)
    expect(revalidateTag).toHaveBeenCalledWith("tab:wishlist:user-111", REVALIDATE_PROFILE)
  })

  it("revalidates wishlist root for wishlist mutations", () => {
    revalidateForWishlistMutation(USER_ID)

    expect(revalidateTag).toHaveBeenCalledWith("tab:wishlist:user-111", REVALIDATE_PROFILE)
  })
})
