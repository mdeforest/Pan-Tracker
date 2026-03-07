import { describe, it, expect } from "vitest"
import { AddToPanSchema, UpdatePanEntrySchema, CarryOverSchema } from "@/lib/validations/pan"

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000"

describe("AddToPanSchema", () => {
  it("passes with a valid UUID", () => {
    const result = AddToPanSchema.safeParse({ product_id: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("fails with an invalid UUID", () => {
    const result = AddToPanSchema.safeParse({ product_id: "not-a-uuid" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.product_id).toBeDefined()
    }
  })

  it("fails when product_id is missing", () => {
    const result = AddToPanSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("UpdatePanEntrySchema", () => {
  it("passes with usage_level", () => {
    const result = UpdatePanEntrySchema.safeParse({ usage_level: "half" })
    expect(result.success).toBe(true)
  })

  it("passes with notes", () => {
    const result = UpdatePanEntrySchema.safeParse({ notes: "almost done!" })
    expect(result.success).toBe(true)
  })

  it("passes with null notes (clearing)", () => {
    const result = UpdatePanEntrySchema.safeParse({ notes: null })
    expect(result.success).toBe(true)
  })

  it("passes with status", () => {
    const result = UpdatePanEntrySchema.safeParse({ status: "paused" })
    expect(result.success).toBe(true)
  })

  it("passes with all fields at once", () => {
    const result = UpdatePanEntrySchema.safeParse({
      usage_level: "three_quarters",
      notes: "nearly there",
      status: "active",
    })
    expect(result.success).toBe(true)
  })

  it("fails with empty object", () => {
    const result = UpdatePanEntrySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("fails with invalid usage_level", () => {
    const result = UpdatePanEntrySchema.safeParse({ usage_level: "50%" })
    expect(result.success).toBe(false)
  })

  it("fails with invalid status", () => {
    const result = UpdatePanEntrySchema.safeParse({ status: "deleted" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid usage levels", () => {
    const levels = ["just_started", "quarter", "half", "three_quarters", "almost_done"]
    for (const usage_level of levels) {
      const result = UpdatePanEntrySchema.safeParse({ usage_level })
      expect(result.success).toBe(true)
    }
  })

  it("accepts all valid statuses", () => {
    const statuses = ["active", "empty", "paused"]
    for (const status of statuses) {
      const result = UpdatePanEntrySchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })
})

describe("CarryOverSchema", () => {
  it("passes with one product ID", () => {
    const result = CarryOverSchema.safeParse({ product_ids: [VALID_UUID] })
    expect(result.success).toBe(true)
  })

  it("passes with multiple product IDs", () => {
    const result = CarryOverSchema.safeParse({
      product_ids: [VALID_UUID, "223e4567-e89b-12d3-a456-426614174000"],
    })
    expect(result.success).toBe(true)
  })

  it("fails with empty product_ids array", () => {
    const result = CarryOverSchema.safeParse({ product_ids: [] })
    expect(result.success).toBe(false)
  })

  it("fails when product_ids is missing", () => {
    const result = CarryOverSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("fails when any product ID is not a valid UUID", () => {
    const result = CarryOverSchema.safeParse({ product_ids: [VALID_UUID, "bad-id"] })
    expect(result.success).toBe(false)
  })
})
