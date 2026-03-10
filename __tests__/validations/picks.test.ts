import { describe, it, expect } from "vitest"
import { ListPicksSchema, SetPicksSchema } from "@/lib/validations/picks"

const VALID_UUID = "223e4567-e89b-42d3-a456-426614174000"

describe("ListPicksSchema", () => {
  it("accepts valid month and year values", () => {
    const result = ListPicksSchema.safeParse({ month: "3", year: "2026" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid month values", () => {
    const result = ListPicksSchema.safeParse({ month: "13", year: "2026" })
    expect(result.success).toBe(false)
  })
})

describe("SetPicksSchema", () => {
  it("accepts valid pan_entry_ids, month, and year", () => {
    const result = SetPicksSchema.safeParse({
      pan_entry_ids: [VALID_UUID],
      month: 3,
      year: 2026,
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid pan entry ids", () => {
    const result = SetPicksSchema.safeParse({
      pan_entry_ids: ["not-a-uuid"],
      month: 3,
      year: 2026,
    })
    expect(result.success).toBe(false)
  })
})
