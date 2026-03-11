import { describe, it, expect } from "vitest"
import {
  CreateWishlistItemSchema,
  ListWishlistSchema,
  UpdateWishlistItemSchema,
} from "@/lib/validations/wishlist"

const UUID = "123e4567-e89b-12d3-a456-426614174000"

describe("ListWishlistSchema", () => {
  it("accepts all supported statuses", () => {
    for (const status of ["to_buy", "purchased", "all"]) {
      const result = ListWishlistSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    const result = ListWishlistSchema.safeParse({ status: "later" })
    expect(result.success).toBe(false)
  })
})

describe("CreateWishlistItemSchema", () => {
  it("passes with required fields", () => {
    const result = CreateWishlistItemSchema.safeParse({
      brand: "Rare Beauty",
      name: "Soft Pinch Powder Blush",
    })
    expect(result.success).toBe(true)
  })

  it("passes with linked product and optional fields", () => {
    const result = CreateWishlistItemSchema.safeParse({
      product_id: UUID,
      brand: "Rare Beauty",
      name: "Soft Pinch Powder Blush",
      notes: "Repurchase if on sale",
      estimated_price: 29.987,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.estimated_price).toBe(29.99)
    }
  })

  it("rejects missing brand", () => {
    const result = CreateWishlistItemSchema.safeParse({ name: "Blush" })
    expect(result.success).toBe(false)
  })

  it("rejects missing name", () => {
    const result = CreateWishlistItemSchema.safeParse({ brand: "Rare Beauty" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid linked product id", () => {
    const result = CreateWishlistItemSchema.safeParse({
      product_id: "invalid",
      brand: "Rare Beauty",
      name: "Blush",
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative price", () => {
    const result = CreateWishlistItemSchema.safeParse({
      brand: "Rare Beauty",
      name: "Blush",
      estimated_price: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe("UpdateWishlistItemSchema", () => {
  it("accepts purchased toggle", () => {
    const result = UpdateWishlistItemSchema.safeParse({ purchased: true })
    expect(result.success).toBe(true)
  })

  it("accepts nullable fields for clearing", () => {
    const result = UpdateWishlistItemSchema.safeParse({
      product_id: null,
      notes: null,
      estimated_price: null,
      purchased: false,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty payload", () => {
    const result = UpdateWishlistItemSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
