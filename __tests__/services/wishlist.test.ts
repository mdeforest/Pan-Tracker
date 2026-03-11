import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockSupabase } from "../helpers/supabase-mock"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

import { createClient } from "@/lib/supabase/server"
import {
  createWishlistItem,
  deleteWishlistItem,
  listWishlistItems,
  updateWishlistItem,
} from "@/lib/services/wishlist"

const USER_ID = "user-111"
const ITEM_ID = "wish-222"
const PRODUCT_ID = "prod-333"

const mockItem = {
  id: ITEM_ID,
  user_id: USER_ID,
  product_id: PRODUCT_ID,
  brand: "Rare Beauty",
  name: "Soft Pinch Powder Blush",
  notes: null,
  estimated_price: 29,
  purchased_at: null,
  created_at: "2026-03-10T00:00:00Z",
}

function setup(tableResults: Parameters<typeof createMockSupabase>[0] = {}) {
  const mock = createMockSupabase({
    wishlist_items: { data: mockItem, error: null },
    products: { data: { id: PRODUCT_ID }, error: null },
    ...tableResults,
  })
  vi.mocked(createClient).mockResolvedValue(mock as never)
  return mock
}

describe("listWishlistItems", () => {
  beforeEach(() => vi.clearAllMocks())

  it("filters to to-buy items", async () => {
    const mock = setup({ wishlist_items: { data: [mockItem], error: null } })

    await listWishlistItems(USER_ID, "to_buy")

    const b = mock._builders.wishlist_items
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.is).toHaveBeenCalledWith("purchased_at", null)
    expect(b.order).toHaveBeenCalledWith("created_at", { ascending: false })
  })

  it("filters to purchased items", async () => {
    const mock = setup({ wishlist_items: { data: [mockItem], error: null } })

    await listWishlistItems(USER_ID, "purchased")

    const b = mock._builders.wishlist_items
    expect(b.not).toHaveBeenCalledWith("purchased_at", "is", null)
    expect(b.order).toHaveBeenCalledWith("purchased_at", { ascending: false })
  })
})

describe("createWishlistItem", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates an unpurchased item", async () => {
    const mock = setup()

    await createWishlistItem(USER_ID, {
      product_id: PRODUCT_ID,
      brand: "Rare Beauty",
      name: "Soft Pinch Powder Blush",
      estimated_price: 29,
    })

    const b = mock._builders.wishlist_items
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        product_id: PRODUCT_ID,
        brand: "Rare Beauty",
        name: "Soft Pinch Powder Blush",
        purchased_at: null,
      })
    )
  })

  it("rejects linked products the user does not own", async () => {
    const mock = setup({
      products: { data: null, error: { message: "not found" } },
    })

    const { data, error } = await createWishlistItem(USER_ID, {
      product_id: PRODUCT_ID,
      brand: "Rare Beauty",
      name: "Soft Pinch Powder Blush",
    })

    expect(data).toBeNull()
    expect(error?.message).toBe("Product not found")
    expect(mock._builders.wishlist_items?.insert).toBeUndefined()
  })
})

describe("updateWishlistItem", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sets purchased_at when purchased is true", async () => {
    const mock = setup()

    await updateWishlistItem(USER_ID, ITEM_ID, { purchased: true })

    const b = mock._builders.wishlist_items
    expect(b.update).toHaveBeenCalledWith(
      expect.objectContaining({ purchased_at: expect.any(String) })
    )
    expect(b.eq).toHaveBeenCalledWith("id", ITEM_ID)
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
  })

  it("clears purchased_at when purchased is false", async () => {
    const mock = setup()

    await updateWishlistItem(USER_ID, ITEM_ID, { purchased: false })

    const b = mock._builders.wishlist_items
    expect(b.update).toHaveBeenCalledWith(expect.objectContaining({ purchased_at: null }))
  })
})

describe("deleteWishlistItem", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes by id and user", async () => {
    const mock = setup()

    await deleteWishlistItem(USER_ID, ITEM_ID)

    const b = mock._builders.wishlist_items
    expect(b.delete).toHaveBeenCalled()
    expect(b.eq).toHaveBeenCalledWith("id", ITEM_ID)
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
  })
})
