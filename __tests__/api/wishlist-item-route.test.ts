import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/wishlist", () => ({
  updateWishlistItem: vi.fn(),
  deleteWishlistItem: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForWishlistMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { deleteWishlistItem, updateWishlistItem } from "@/lib/services/wishlist"
import { revalidateForWishlistMutation } from "@/lib/cache/tab-cache"
import { DELETE, PATCH } from "@/app/api/wishlist/[id]/route"

const USER_ID = "11111111-1111-1111-1111-111111111111"
const ITEM_ID = "550e8400-e29b-41d4-a716-446655440000"

describe("PATCH /api/wishlist/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }),
      },
    } as never)
  })

  it("revalidates wishlist cache on success", async () => {
    vi.mocked(updateWishlistItem).mockResolvedValue({
      data: { id: ITEM_ID },
      error: null,
    } as never)

    const req = {
      json: vi.fn().mockResolvedValue({ purchased: true }),
    } as unknown as NextRequest

    const res = await PATCH(req, { params: { id: ITEM_ID } })

    expect(res.status).toBe(200)
    expect(updateWishlistItem).toHaveBeenCalledWith(USER_ID, ITEM_ID, { purchased: true })
    expect(revalidateForWishlistMutation).toHaveBeenCalledWith(USER_ID)
  })

  it("does not revalidate when update fails", async () => {
    vi.mocked(updateWishlistItem).mockResolvedValue({
      data: null,
      error: { message: "update failed" },
    } as never)

    const req = {
      json: vi.fn().mockResolvedValue({ purchased: true }),
    } as unknown as NextRequest

    const res = await PATCH(req, { params: { id: ITEM_ID } })

    expect(res.status).toBe(500)
    expect(revalidateForWishlistMutation).not.toHaveBeenCalled()
  })
})

describe("DELETE /api/wishlist/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }),
      },
    } as never)
  })

  it("revalidates wishlist cache on success", async () => {
    vi.mocked(deleteWishlistItem).mockResolvedValue({
      data: { id: ITEM_ID },
      error: null,
    } as never)

    const res = await DELETE({} as NextRequest, { params: { id: ITEM_ID } })

    expect(res.status).toBe(200)
    expect(deleteWishlistItem).toHaveBeenCalledWith(USER_ID, ITEM_ID)
    expect(revalidateForWishlistMutation).toHaveBeenCalledWith(USER_ID)
  })

  it("does not revalidate when delete fails", async () => {
    vi.mocked(deleteWishlistItem).mockResolvedValue({
      data: null,
      error: { message: "delete failed" },
    } as never)

    const res = await DELETE({} as NextRequest, { params: { id: ITEM_ID } })

    expect(res.status).toBe(500)
    expect(revalidateForWishlistMutation).not.toHaveBeenCalled()
  })
})
