import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/import-collection", () => ({
  importCollectionRows: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForProductMutation: vi.fn(),
  revalidateForEmptiesMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { importCollectionRows } from "@/lib/services/import-collection"
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
    vi.mocked(importCollectionRows).mockResolvedValue({
      imported: 1,
      skipped: 0,
      errors: [],
    })
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

  it("returns 400 when rows array is empty", async () => {
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when a row is missing required fields", async () => {
    const res = await POST(makeRequest({ rows: [{ brand: "Tatcha" }] }))
    expect(res.status).toBe(400)
  })

  it("returns summary on success", async () => {
    const res = await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ imported: 1, skipped: 0, errors: [] })
  })

  it("calls importCollectionRows with userId and parsed rows", async () => {
    await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(importCollectionRows).toHaveBeenCalledWith(USER_ID, [VALID_ROW])
  })
})
