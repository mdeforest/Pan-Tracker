import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/pan", () => ({
  addToPan: vi.fn(),
  updatePanEntry: vi.fn(),
}))
vi.mock("@/lib/services/picks", () => ({
  setPickForEntry: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForPanMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { addToPan, updatePanEntry } from "@/lib/services/pan"
import { setPickForEntry } from "@/lib/services/picks"
import { revalidateForPanMutation } from "@/lib/cache/tab-cache"
import { POST } from "@/app/api/pans/[year]/[month]/entries/route"
import { PATCH } from "@/app/api/pans/[year]/[month]/entries/[id]/route"

const USER_ID = "11111111-1111-1111-1111-111111111111"
const PRODUCT_ID = "550e8400-e29b-41d4-a716-446655440000"

describe("POST /api/pans/[year]/[month]/entries", () => {
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

  it("revalidates pan and products caches after a successful add", async () => {
    vi.mocked(addToPan).mockResolvedValue({
      data: { id: "33333333-3333-3333-3333-333333333333" },
      error: null,
    } as never)

    const req = {
      json: vi.fn().mockResolvedValue({ product_id: PRODUCT_ID }),
    } as unknown as NextRequest

    const res = await POST(req, { params: Promise.resolve({ year: "2026", month: "3" }) })

    expect(res.status).toBe(201)
    expect(revalidateForPanMutation).toHaveBeenCalledWith(USER_ID, {
      year: 2026,
      month: 3,
    })
  })

  it("does not revalidate when add fails", async () => {
    vi.mocked(addToPan).mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    } as never)

    const req = {
      json: vi.fn().mockResolvedValue({ product_id: PRODUCT_ID }),
    } as unknown as NextRequest

    const res = await POST(req, { params: Promise.resolve({ year: "2026", month: "3" }) })

    expect(res.status).toBe(500)
    expect(revalidateForPanMutation).not.toHaveBeenCalled()
  })
})

describe("PATCH /api/pans/[year]/[month]/entries/[id]", () => {
  const ENTRY_ID = "33333333-3333-4333-8333-333333333333"

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

  it("handles pick-only payloads without running generic update validation", async () => {
    vi.mocked(setPickForEntry).mockResolvedValue({
      data: { id: "pick-1" },
      error: null,
    } as never)

    const req = {
      json: vi.fn().mockResolvedValue({ is_pick: true }),
    } as unknown as NextRequest

    const res = await PATCH(req, {
      params: Promise.resolve({ year: "2026", month: "3", id: ENTRY_ID }),
    })

    expect(res.status).toBe(200)
    expect(setPickForEntry).toHaveBeenCalledWith(USER_ID, ENTRY_ID, 3, 2026, true)
    expect(updatePanEntry).not.toHaveBeenCalled()
    expect(revalidateForPanMutation).toHaveBeenCalledWith(USER_ID, { year: 2026, month: 3 })
  })
})
