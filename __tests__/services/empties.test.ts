import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "../helpers/supabase-mock"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

import { createClient } from "@/lib/supabase/server"
import { listEmpties, createEmpty } from "@/lib/services/empties"

const USER_ID = "user-111"
const ENTRY_ID = "entry-333"
const PRODUCT_ID = "prod-222"

const mockEmpty = {
  id: "empty-444",
  user_id: USER_ID,
  pan_entry_id: ENTRY_ID,
  product_id: PRODUCT_ID,
  finished_month: 3,
  finished_year: 2026,
  rating: 4,
  would_repurchase: "yes",
  review_notes: null,
  replacement_product_id: null,
  replacement_free_text: null,
  created_at: "2026-03-31T00:00:00Z",
}

describe("listEmpties", () => {
  beforeEach(() => vi.clearAllMocks())

  it("queries empties table filtered by user_id", async () => {
    const mock = createMockSupabase({ empties: { data: [mockEmpty], error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await listEmpties(USER_ID, {})

    expect(mock.from).toHaveBeenCalledWith("empties")
    const b = mock._builders.empties
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
  })

  it("selects a narrowed empties payload without pan_entries join", async () => {
    const mock = createMockSupabase({ empties: { data: [mockEmpty], error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await listEmpties(USER_ID, {})

    const b = mock._builders.empties
    const [selectArg] = b.select.mock.calls[0] as [string]

    expect(selectArg).toContain("id,finished_month,finished_year")
    expect(selectArg).toContain("products:products!empties_product_id_fkey")
    expect(selectArg).not.toContain("pan_entries")
    expect(selectArg).not.toContain("products!empties_product_id_fkey(*)")
  })

  it("applies year filter when provided", async () => {
    const mock = createMockSupabase({ empties: { data: [], error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await listEmpties(USER_ID, { year: 2026 })

    const b = mock._builders.empties
    expect(b.eq).toHaveBeenCalledWith("finished_year", 2026)
  })

  it("applies month filter when provided", async () => {
    const mock = createMockSupabase({ empties: { data: [], error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await listEmpties(USER_ID, { month: 3 })

    const b = mock._builders.empties
    expect(b.eq).toHaveBeenCalledWith("finished_month", 3)
  })

  it("does not apply year/month filters when not provided", async () => {
    const mock = createMockSupabase({ empties: { data: [], error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await listEmpties(USER_ID, {})

    const b = mock._builders.empties
    const eqCalls = b.eq.mock.calls as [string, unknown][]
    expect(eqCalls.some(([col]) => col === "finished_year")).toBe(false)
    expect(eqCalls.some(([col]) => col === "finished_month")).toBe(false)
  })

  it("orders results reverse-chronologically", async () => {
    const mock = createMockSupabase({ empties: { data: [], error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await listEmpties(USER_ID, {})

    const b = mock._builders.empties
    expect(b.order).toHaveBeenCalledWith("finished_year", { ascending: false })
    expect(b.order).toHaveBeenCalledWith("finished_month", { ascending: false })
  })
})

describe("createEmpty", () => {
  beforeEach(() => vi.clearAllMocks())

  it("inserts empty record and updates pan_entry status atomically", async () => {
    const mock = createMockSupabase({
      pan_entries: { data: { id: ENTRY_ID, product_id: PRODUCT_ID }, error: null },
      empties: { data: mockEmpty, error: null },
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const { data, error } = await createEmpty(USER_ID, {
      pan_entry_id: ENTRY_ID,
      finished_month: 3,
      finished_year: 2026,
      rating: 4,
      would_repurchase: "yes",
    })

    expect(error).toBeNull()
    expect(data).toEqual(mockEmpty)

    // verify empty insert
    expect(mock.from).toHaveBeenCalledWith("empties")
    const eb = mock._builders.empties
    expect(eb.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        pan_entry_id: ENTRY_ID,
        product_id: PRODUCT_ID,
        finished_month: 3,
        finished_year: 2026,
        rating: 4,
        would_repurchase: "yes",
      })
    )

    // verify pan_entry status update
    expect(mock.from).toHaveBeenCalledWith("pan_entries")
    const pb = mock._builders.pan_entries
    expect(pb.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "empty", updated_at: expect.any(String) })
    )
    expect(pb.eq).toHaveBeenCalledWith("id", ENTRY_ID)
    expect(pb.eq).toHaveBeenCalledWith("user_id", USER_ID)
  })

  it("returns error if the empty insert fails", async () => {
    const mock = createMockSupabase({
      pan_entries: { data: { id: ENTRY_ID, product_id: PRODUCT_ID }, error: null },
      empties: { data: null, error: { message: "insert failed" } },
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const { data, error } = await createEmpty(USER_ID, {
      pan_entry_id: ENTRY_ID,
      finished_month: 3,
      finished_year: 2026,
    })

    expect(data).toBeNull()
    expect(error).toEqual({ message: "insert failed" })
    const pb = mock._builders.pan_entries
    expect(pb.update).not.toHaveBeenCalled()
  })

  it("rejects empties for pan entries the user does not own", async () => {
    const mock = createMockSupabase({
      pan_entries: { data: null, error: { message: "not found" } },
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const { data, error } = await createEmpty(USER_ID, {
      pan_entry_id: ENTRY_ID,
      finished_month: 3,
      finished_year: 2026,
    })

    expect(data).toBeNull()
    expect(error?.message).toBe("Pan entry not found")
    expect(mock.from).not.toHaveBeenCalledWith("empties")
  })

  it("rejects replacement products the user does not own", async () => {
    const mock = createMockSupabase({
      pan_entries: { data: { id: ENTRY_ID, product_id: PRODUCT_ID }, error: null },
      products: { data: null, error: { message: "not found" } },
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const { data, error } = await createEmpty(USER_ID, {
      pan_entry_id: ENTRY_ID,
      finished_month: 3,
      finished_year: 2026,
      replacement_product_id: "prod-999",
    })

    expect(data).toBeNull()
    expect(error?.message).toBe("Replacement product not found")
    expect(mock.from).not.toHaveBeenCalledWith("empties")
  })
})
