import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "../helpers/supabase-mock"

// Mock before importing the module under test
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

import { createClient } from "@/lib/supabase/server"
import { listProducts, createProduct, updateProduct, archiveProduct } from "@/lib/services/products"

const USER_ID = "user-111"
const PRODUCT_ID = "prod-222"

const mockProduct = {
  id: PRODUCT_ID,
  user_id: USER_ID,
  brand: "NARS",
  name: "Blush",
  category: "makeup",
  notes: null,
  photo_url: null,
  archived_at: null,
  created_at: "2026-01-01T00:00:00Z",
}

function setup(tableResults: Parameters<typeof createMockSupabase>[0] = {}) {
  const mock = createMockSupabase({
    products: { data: mockProduct, error: null },
    ...tableResults,
  })
  vi.mocked(createClient).mockResolvedValue(mock as never)
  return mock
}

describe("listProducts", () => {
  beforeEach(() => vi.clearAllMocks())

  it("queries the products table filtered by user_id and archived_at", async () => {
    const mock = setup({ products: { data: [mockProduct], error: null } })
    await listProducts(USER_ID)

    expect(mock.from).toHaveBeenCalledWith("products")
    const b = mock._builders.products
    expect(b.select).toHaveBeenCalledWith("id,name,brand,category,photo_url")
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.is).toHaveBeenCalledWith("archived_at", null)
    expect(b.order).toHaveBeenCalledWith("created_at", { ascending: false })
  })

  it("applies the q filter via .or() when provided", async () => {
    const mock = setup({ products: { data: [], error: null } })
    await listProducts(USER_ID, "nars")

    const b = mock._builders.products
    expect(b.or).toHaveBeenCalledWith("name.ilike.%nars%,brand.ilike.%nars%")
  })

  it("does not apply .or() when q is not provided", async () => {
    const mock = setup({ products: { data: [], error: null } })
    await listProducts(USER_ID)

    const b = mock._builders.products
    expect(b.or).not.toHaveBeenCalled()
  })

  it("applies category filter via .eq() when provided", async () => {
    const mock = setup({ products: { data: [], error: null } })
    await listProducts(USER_ID, undefined, "skincare")

    const b = mock._builders.products
    expect(b.eq).toHaveBeenCalledWith("category", "skincare")
  })

  it("returns data and error from Supabase", async () => {
    setup({ products: { data: [mockProduct], error: null } })
    const result = await listProducts(USER_ID)
    expect(result.data).toEqual([mockProduct])
    expect(result.error).toBeNull()
  })
})

describe("createProduct", () => {
  beforeEach(() => vi.clearAllMocks())

  it("inserts into products with correct fields", async () => {
    const mock = setup()
    await createProduct(USER_ID, {
      brand: "NARS",
      name: "Blush",
      category: "makeup",
      notes: "great",
    })

    const b = mock._builders.products
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        brand: "NARS",
        name: "Blush",
        category: "makeup",
        notes: "great",
      })
    )
    expect(b.select).toHaveBeenCalled()
    expect(b.single).toHaveBeenCalled()
  })

  it("defaults missing optional fields to null", async () => {
    const mock = setup()
    await createProduct(USER_ID, { brand: "NARS", name: "Blush", category: "makeup" })

    const b = mock._builders.products
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null, photo_url: null })
    )
  })
})

describe("updateProduct", () => {
  beforeEach(() => vi.clearAllMocks())

  it("updates the correct product and verifies ownership", async () => {
    const mock = setup()
    await updateProduct(USER_ID, PRODUCT_ID, { brand: "Charlotte Tilbury" })

    const b = mock._builders.products
    expect(b.update).toHaveBeenCalledWith(expect.objectContaining({ brand: "Charlotte Tilbury" }))
    expect(b.eq).toHaveBeenCalledWith("id", PRODUCT_ID)
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.is).toHaveBeenCalledWith("archived_at", null)
    expect(b.single).toHaveBeenCalled()
  })
})

describe("archiveProduct", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sets archived_at and verifies ownership", async () => {
    const mock = setup()
    await archiveProduct(USER_ID, PRODUCT_ID)

    const b = mock._builders.products
    expect(b.update).toHaveBeenCalledWith(
      expect.objectContaining({ archived_at: expect.any(String) })
    )
    expect(b.eq).toHaveBeenCalledWith("id", PRODUCT_ID)
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.single).toHaveBeenCalled()
  })

  it("returns error when Supabase reports an error", async () => {
    setup({ products: { data: null, error: { message: "not found" } } })
    const { error } = await archiveProduct(USER_ID, PRODUCT_ID)
    expect(error).toEqual({ message: "not found" })
  })
})
