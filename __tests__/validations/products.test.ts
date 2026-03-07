import { describe, it, expect } from "vitest"
import { CreateProductSchema, UpdateProductSchema } from "@/lib/validations/products"

describe("CreateProductSchema", () => {
  const valid = { brand: "NARS", name: "Blush", category: "makeup" }

  it("passes with required fields", () => {
    const result = CreateProductSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("passes with all optional fields", () => {
    const result = CreateProductSchema.safeParse({
      ...valid,
      notes: "fave blush",
      photo_url: "https://example.com/photo.jpg",
    })
    expect(result.success).toBe(true)
  })

  it("passes with null photo_url", () => {
    const result = CreateProductSchema.safeParse({ ...valid, photo_url: null })
    expect(result.success).toBe(true)
  })

  it("fails when brand is missing", () => {
    const result = CreateProductSchema.safeParse({ name: "Blush", category: "makeup" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.brand).toBeDefined()
    }
  })

  it("fails when name is missing", () => {
    const result = CreateProductSchema.safeParse({ brand: "NARS", category: "makeup" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined()
    }
  })

  it("fails when brand is empty string", () => {
    const result = CreateProductSchema.safeParse({ ...valid, brand: "" })
    expect(result.success).toBe(false)
  })

  it("fails with invalid category", () => {
    const result = CreateProductSchema.safeParse({ ...valid, category: "food" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.category).toBeDefined()
    }
  })

  it("accepts all valid categories", () => {
    const categories = ["makeup", "skincare", "haircare", "bodycare", "fragrance", "tools", "other"]
    for (const category of categories) {
      const result = CreateProductSchema.safeParse({ ...valid, category })
      expect(result.success).toBe(true)
    }
  })

  it("fails with invalid photo_url", () => {
    const result = CreateProductSchema.safeParse({ ...valid, photo_url: "not-a-url" })
    expect(result.success).toBe(false)
  })
})

describe("UpdateProductSchema", () => {
  it("passes with a single field", () => {
    const result = UpdateProductSchema.safeParse({ brand: "Charlotte Tilbury" })
    expect(result.success).toBe(true)
  })

  it("passes with multiple fields", () => {
    const result = UpdateProductSchema.safeParse({ brand: "Too Faced", name: "Better Than Sex" })
    expect(result.success).toBe(true)
  })

  it("fails with empty object", () => {
    const result = UpdateProductSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("fails with invalid category", () => {
    const result = UpdateProductSchema.safeParse({ category: "invalid" })
    expect(result.success).toBe(false)
  })

  it("passes with null notes (clearing a field)", () => {
    const result = UpdateProductSchema.safeParse({ notes: null })
    // notes is optional in the update schema
    expect(result.success).toBe(true)
  })
})
