import { describe, it, expect } from "vitest"
import { CreateEmptySchema } from "@/lib/validations/empties"

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000"

describe("CreateEmptySchema", () => {
  it("passes with only required field", () => {
    const result = CreateEmptySchema.safeParse({ pan_entry_id: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("passes with all fields", () => {
    const result = CreateEmptySchema.safeParse({
      pan_entry_id: VALID_UUID,
      rating: 4,
      would_repurchase: "yes",
      review_notes: "Great product, lasting finish",
      replacement_product_id: "223e4567-e89b-12d3-a456-426614174000",
      replacement_free_text: "Trying the Rare Beauty version next",
    })
    expect(result.success).toBe(true)
  })

  it("fails when pan_entry_id is missing", () => {
    const result = CreateEmptySchema.safeParse({ rating: 3 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.pan_entry_id).toBeDefined()
    }
  })

  it("fails when pan_entry_id is not a UUID", () => {
    const result = CreateEmptySchema.safeParse({ pan_entry_id: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("fails when rating is 0", () => {
    const result = CreateEmptySchema.safeParse({ pan_entry_id: VALID_UUID, rating: 0 })
    expect(result.success).toBe(false)
  })

  it("fails when rating is 6", () => {
    const result = CreateEmptySchema.safeParse({ pan_entry_id: VALID_UUID, rating: 6 })
    expect(result.success).toBe(false)
  })

  it("passes with all valid ratings (1–5)", () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const result = CreateEmptySchema.safeParse({ pan_entry_id: VALID_UUID, rating })
      expect(result.success).toBe(true)
    }
  })

  it("fails with fractional rating", () => {
    const result = CreateEmptySchema.safeParse({ pan_entry_id: VALID_UUID, rating: 3.5 })
    expect(result.success).toBe(false)
  })

  it("fails with invalid would_repurchase value", () => {
    const result = CreateEmptySchema.safeParse({
      pan_entry_id: VALID_UUID,
      would_repurchase: "definitely",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid would_repurchase values", () => {
    for (const would_repurchase of ["yes", "no", "maybe"]) {
      const result = CreateEmptySchema.safeParse({ pan_entry_id: VALID_UUID, would_repurchase })
      expect(result.success).toBe(true)
    }
  })

  it("fails when replacement_product_id is not a UUID", () => {
    const result = CreateEmptySchema.safeParse({
      pan_entry_id: VALID_UUID,
      replacement_product_id: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })
})
