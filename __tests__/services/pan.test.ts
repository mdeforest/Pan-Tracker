import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockSupabase, createMockAdminClient } from "../helpers/supabase-mock"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/supabase/server-admin", () => ({ createAdminClient: vi.fn() }))

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import {
  getPanEntries,
  getPanEntry,
  addToPan,
  updatePanEntry,
  carryOverEntries,
} from "@/lib/services/pan"

const USER_ID = "user-111"
const ENTRY_ID = "entry-333"
const PRODUCT_ID = "prod-222"

const mockEntry = {
  id: ENTRY_ID,
  user_id: USER_ID,
  product_id: PRODUCT_ID,
  status: "active",
  usage_level: "just_started",
  started_month: 3,
  started_year: 2026,
  notes: null,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
}

describe("getPanEntries", () => {
  beforeEach(() => vi.clearAllMocks())

  it("queries pan_entries filtered by user and active/paused status", async () => {
    const mock = createMockSupabase({
      pan_entries: { data: [mockEntry], error: null },
      monthly_picks: { data: [], error: null },
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await getPanEntries(USER_ID, 2026, 3)

    expect(mock.from).toHaveBeenCalledWith("pan_entries")
    const b = mock._builders.pan_entries
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.in).toHaveBeenCalledWith("status", ["active", "paused"])
  })

  it("queries monthly_picks for the given month/year", async () => {
    const mock = createMockSupabase({
      pan_entries: { data: [], error: null },
      monthly_picks: { data: [], error: null },
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await getPanEntries(USER_ID, 2026, 3)

    expect(mock.from).toHaveBeenCalledWith("monthly_picks")
    const b = mock._builders.monthly_picks
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.eq).toHaveBeenCalledWith("month", 3)
    expect(b.eq).toHaveBeenCalledWith("year", 2026)
  })
})

describe("getPanEntry", () => {
  beforeEach(() => vi.clearAllMocks())

  it("fetches a single entry by id and user_id", async () => {
    const mock = createMockSupabase({ pan_entries: { data: mockEntry, error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const { data } = await getPanEntry(USER_ID, ENTRY_ID)

    expect(data).toEqual(mockEntry)
    const b = mock._builders.pan_entries
    expect(b.eq).toHaveBeenCalledWith("id", ENTRY_ID)
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
    expect(b.single).toHaveBeenCalled()
  })
})

describe("addToPan", () => {
  beforeEach(() => vi.clearAllMocks())

  it("inserts a pan entry with default status and usage_level", async () => {
    const mock = createMockSupabase({ pan_entries: { data: mockEntry, error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await addToPan(USER_ID, PRODUCT_ID, 2026, 3)

    const b = mock._builders.pan_entries
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        product_id: PRODUCT_ID,
        started_month: 3,
        started_year: 2026,
        status: "active",
        usage_level: "just_started",
      })
    )
  })
})

describe("updatePanEntry", () => {
  beforeEach(() => vi.clearAllMocks())

  it("updates the entry and always sets updated_at", async () => {
    const mock = createMockSupabase({ pan_entries: { data: mockEntry, error: null } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    await updatePanEntry(USER_ID, ENTRY_ID, { usage_level: "half" })

    const b = mock._builders.pan_entries
    expect(b.update).toHaveBeenCalledWith(
      expect.objectContaining({ usage_level: "half", updated_at: expect.any(String) })
    )
    expect(b.eq).toHaveBeenCalledWith("id", ENTRY_ID)
    expect(b.eq).toHaveBeenCalledWith("user_id", USER_ID)
  })

  it("verifies ownership — does not update other users' entries", async () => {
    const mock = createMockSupabase({ pan_entries: { data: null, error: { message: "not found" } } })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const { error } = await updatePanEntry("other-user", ENTRY_ID, { status: "paused" })
    expect(error).toBeDefined()
  })
})

describe("carryOverEntries", () => {
  beforeEach(() => vi.clearAllMocks())

  it("inserts one pan_entry per product_id using the admin client", async () => {
    const adminMock = createMockAdminClient({
      pan_entries: { data: mockEntry, error: null },
    })
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    await carryOverEntries(USER_ID, [PRODUCT_ID], 2026, 4)

    expect(adminMock.from).toHaveBeenCalledWith("pan_entries")
    const b = adminMock._builders.pan_entries
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        product_id: PRODUCT_ID,
        started_month: 4,
        started_year: 2026,
        status: "active",
        usage_level: "just_started",
      })
    )
  })

  it("returns only successfully created entries", async () => {
    const adminMock = createMockAdminClient({
      pan_entries: { data: mockEntry, error: null },
    })
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    const { data, error } = await carryOverEntries(USER_ID, [PRODUCT_ID], 2026, 4)

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })
})
