import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/import-collection", () => ({
  importCollectionRows: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForProductMutation: vi.fn(),
  revalidateForEmptiesMutation: vi.fn(),
  revalidateForWishlistMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { importCollectionRows } from "@/lib/services/import-collection"
import {
  revalidateForProductMutation,
  revalidateForEmptiesMutation,
  revalidateForWishlistMutation,
} from "@/lib/cache/tab-cache"
import { POST } from "@/app/api/import/collection/route"

const USER_ID = "11111111-1111-1111-1111-111111111111"

const VALID_ROW = {
  brand: "Tatcha",
  name: "Duo Rice Cleanse",
  category: "serum",
  sizeWeight: "1.7 oz",
  manufactureDate: "2024-07-01",
  dateInCollection: null,
  expirationDate: "2027-07-01",
  isFinished: false,
}

const VALID_WISHLIST_ROW = { brand: "Tatcha", name: "The Dewy Skin Cream" }

const SUCCESS_SUMMARY = {
  imported: 1,
  skipped: 0,
  wishlistImported: 0,
  wishlistSkipped: 0,
  errors: [],
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/import/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/import/collection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: USER_ID } },
        }),
      },
    } as never)
    vi.mocked(importCollectionRows).mockResolvedValue(SUCCESS_SUMMARY)
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never)

    const res = await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when body is invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/import/collection", {
      method: "POST",
      body: "not-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when rows and wishlistRows are both empty", async () => {
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when a row is missing required fields", async () => {
    const res = await POST(makeRequest({ rows: [{ brand: "Tatcha" }] }))
    expect(res.status).toBe(400)
  })

  it("returns summary on success with product rows", async () => {
    const res = await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(SUCCESS_SUMMARY)
  })

  it("returns 200 with only wishlist rows", async () => {
    vi.mocked(importCollectionRows).mockResolvedValue({
      imported: 0,
      skipped: 0,
      wishlistImported: 1,
      wishlistSkipped: 0,
      errors: [],
    })
    const res = await POST(makeRequest({ rows: [], wishlistRows: [VALID_WISHLIST_ROW] }))
    expect(res.status).toBe(200)
  })

  it("calls importCollectionRows with userId, rows, and wishlistRows", async () => {
    await POST(makeRequest({ rows: [VALID_ROW], wishlistRows: [VALID_WISHLIST_ROW] }))
    expect(importCollectionRows).toHaveBeenCalledWith(
      USER_ID,
      [VALID_ROW],
      [VALID_WISHLIST_ROW]
    )
  })

  it("calls importCollectionRows with empty wishlistRows when omitted", async () => {
    await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(importCollectionRows).toHaveBeenCalledWith(USER_ID, [VALID_ROW], [])
  })

  it("revalidates products and empties when products are imported", async () => {
    await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(revalidateForProductMutation).toHaveBeenCalledWith(USER_ID)
    expect(revalidateForEmptiesMutation).toHaveBeenCalledWith(USER_ID)
  })

  it("revalidates wishlist when wishlist items are imported", async () => {
    vi.mocked(importCollectionRows).mockResolvedValue({
      imported: 0,
      skipped: 0,
      wishlistImported: 1,
      wishlistSkipped: 0,
      errors: [],
    })
    await POST(makeRequest({ rows: [], wishlistRows: [VALID_WISHLIST_ROW] }))
    expect(revalidateForWishlistMutation).toHaveBeenCalledWith(USER_ID)
  })

  it("skips revalidation when nothing was imported", async () => {
    vi.mocked(importCollectionRows).mockResolvedValue({
      imported: 0,
      skipped: 1,
      wishlistImported: 0,
      wishlistSkipped: 0,
      errors: [],
    })

    await POST(makeRequest({ rows: [VALID_ROW] }))

    expect(revalidateForProductMutation).not.toHaveBeenCalled()
    expect(revalidateForEmptiesMutation).not.toHaveBeenCalled()
    expect(revalidateForWishlistMutation).not.toHaveBeenCalled()
  })
})
