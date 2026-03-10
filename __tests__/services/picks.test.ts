import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase } from "../helpers/supabase-mock"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

import { createClient } from "@/lib/supabase/server"
import { listPicks, setPicks, deletePick } from "@/lib/services/picks"

const USER_ID = "user-111"
const PICK_ID = "pick-111"
const ENTRY_ID = "223e4567-e89b-42d3-a456-426614174000"

const mockPick = {
  id: PICK_ID,
  user_id: USER_ID,
  pan_entry_id: ENTRY_ID,
  month: 3,
  year: 2026,
  carried_over_from_month: null,
  carried_over_from_year: null,
  created_at: "2026-03-01T00:00:00Z",
}

function setup(tableResults: Parameters<typeof createMockSupabase>[0] = {}) {
  const mock = createMockSupabase({
    monthly_picks: { data: [mockPick], error: null },
    pan_entries: { data: [{ id: ENTRY_ID }], error: null },
    ...tableResults,
  })
  vi.mocked(createClient).mockResolvedValue(mock as never)
  return mock
}

describe("listPicks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("queries picks by user, month, and year", async () => {
    const mock = setup()
    await listPicks(USER_ID, 3, 2026)

    expect(mock.from).toHaveBeenCalledWith("monthly_picks")
    const b = mock._builders.monthly_picks
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.eq).toHaveBeenCalledWith("month", 3)
    expect(b.eq).toHaveBeenCalledWith("year", 2026)
    expect(b.order).toHaveBeenCalledWith("created_at", { ascending: false })
  })
})

describe("setPicks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("replaces picks for the month with the provided active pan entries", async () => {
    const mock = setup({ monthly_picks: { data: [mockPick], error: null } })
    await setPicks(USER_ID, [ENTRY_ID], 3, 2026)

    const panBuilder = mock._builders.pan_entries
    expect(panBuilder.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(panBuilder.eq).toHaveBeenCalledWith("status", "active")
    expect(panBuilder.in).toHaveBeenCalledWith("id", [ENTRY_ID])

    const pickBuilder = mock._builders.monthly_picks
    expect(pickBuilder.delete).toHaveBeenCalled()
    expect(pickBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: USER_ID,
        pan_entry_id: ENTRY_ID,
        month: 3,
        year: 2026,
      }),
    ])
  })

  it("allows clearing all picks for the month", async () => {
    const mock = setup({ monthly_picks: { data: [], error: null } })
    const { data, error } = await setPicks(USER_ID, [], 3, 2026)

    expect(error).toBeNull()
    expect(data).toEqual([])
    expect(mock._builders.monthly_picks.insert).not.toHaveBeenCalled()
  })

  it("rejects pan entries the user does not own or that are not active", async () => {
    const mock = setup({ pan_entries: { data: [], error: null } })
    const { data, error } = await setPicks(USER_ID, [ENTRY_ID], 3, 2026)

    expect(data).toBeNull()
    expect(error).toEqual({
      message: "One or more pan entries were not found or are not active",
      code: "PGRST116",
    })
    expect(mock.from).not.toHaveBeenCalledWith("monthly_picks")
  })
})

describe("deletePick", () => {
  beforeEach(() => vi.clearAllMocks())

  it("deletes the pick by id for the current user", async () => {
    const mock = setup({ monthly_picks: { data: mockPick, error: null } })
    await deletePick(USER_ID, PICK_ID)

    const b = mock._builders.monthly_picks
    expect(b.delete).toHaveBeenCalled()
    expect(b.eq).toHaveBeenCalledWith("id", PICK_ID)
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.single).toHaveBeenCalled()
  })
})
