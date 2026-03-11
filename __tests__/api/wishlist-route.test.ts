import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/wishlist", () => ({
  listWishlistItems: vi.fn(),
  createWishlistItem: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForWishlistMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { createWishlistItem, listWishlistItems } from "@/lib/services/wishlist"
import { revalidateForWishlistMutation } from "@/lib/cache/tab-cache"
import { GET, POST } from "@/app/api/wishlist/route"

const USER_ID = "11111111-1111-1111-1111-111111111111"

describe("GET /api/wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }),
      },
    } as never)
  })

  it("defaults status to to_buy", async () => {
    vi.mocked(listWishlistItems).mockResolvedValue({ data: [], error: null } as never)

    const req = new NextRequest("http://localhost/api/wishlist")
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(listWishlistItems).toHaveBeenCalledWith(USER_ID, "to_buy")
  })
})

describe("POST /api/wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }),
      },
    } as never)
  })

  it("revalidates wishlist cache on success", async () => {
    vi.mocked(createWishlistItem).mockResolvedValue({
      data: { id: "wish-1" },
      error: null,
    } as never)

    const req = new NextRequest("http://localhost/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: "Rare Beauty", name: "Blush" }),
    })

    const res = await POST(req)

    expect(res.status).toBe(201)
    expect(revalidateForWishlistMutation).toHaveBeenCalledWith(USER_ID)
  })

  it("does not revalidate on error", async () => {
    vi.mocked(createWishlistItem).mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    } as never)

    const req = new NextRequest("http://localhost/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: "Rare Beauty", name: "Blush" }),
    })

    const res = await POST(req)

    expect(res.status).toBe(500)
    expect(revalidateForWishlistMutation).not.toHaveBeenCalled()
  })
})
