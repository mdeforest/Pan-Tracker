import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/products", () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForProductMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { createProduct } from "@/lib/services/products"
import { revalidateForProductMutation } from "@/lib/cache/tab-cache"
import { POST } from "@/app/api/products/route"

const USER_ID = "11111111-1111-1111-1111-111111111111"

describe("POST /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: USER_ID } },
        }),
      },
    } as never)
  })

  it("revalidates tab caches on successful create", async () => {
    vi.mocked(createProduct).mockResolvedValue({
      data: { id: "22222222-2222-2222-2222-222222222222" },
      error: null,
    } as never)

    const req = new NextRequest("http://localhost/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "Rare Beauty",
        name: "Blush",
        category: "makeup",
      }),
    })

    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(revalidateForProductMutation).toHaveBeenCalledWith(USER_ID)
  })

  it("does not revalidate when create fails", async () => {
    vi.mocked(createProduct).mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    } as never)

    const req = new NextRequest("http://localhost/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: "Rare Beauty",
        name: "Blush",
        category: "makeup",
      }),
    })

    const res = await POST(req)

    expect(res.status).toBe(500)
    expect(revalidateForProductMutation).not.toHaveBeenCalled()
  })
})
