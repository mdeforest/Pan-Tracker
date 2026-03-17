import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProductCategory } from "@/lib/types/app"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

import { createClient } from "@/lib/supabase/server"
import { importHistoryCsv, previewHistoryCsvImport } from "@/lib/services/import-history"

interface MockProduct {
  id: string
  brand: string
  name: string
  category: ProductCategory
  archived_at: string | null
}

interface MockEmpty {
  product_id: string
  finished_year: number
  finished_month: number
}

function createDynamicImportSupabase(options: {
  products?: MockProduct[]
  empties?: MockEmpty[]
  activePanProductIds?: string[]
  failPanInsertCalls?: number[]
}) {
  const state = {
    products: [...(options.products ?? [])],
    empties: [...(options.empties ?? [])],
    activePanProductIds: new Set(options.activePanProductIds ?? []),
    createdProducts: [] as Array<{ brand: string; name: string; category: ProductCategory }>,
    panInserts: [] as Array<Record<string, unknown>>,
    emptyInserts: [] as Array<Record<string, unknown>>,
    panInsertCount: 0,
  }

  const failPanCalls = new Set(options.failPanInsertCalls ?? [])

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "products") {
      let mode: "select" | "insert" = "select"
      let insertPayload: Record<string, unknown> | null = null

      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          mode = "insert"
          insertPayload = payload
          return builder
        }),
        single: vi.fn().mockImplementation(async () => {
          if (mode !== "insert" || !insertPayload) {
            return { data: null, error: { message: "invalid operation" } }
          }

          const created = {
            id: `prod-${state.products.length + 1}`,
            brand: String(insertPayload.brand),
            name: String(insertPayload.name),
            category: insertPayload.category as ProductCategory,
            archived_at: null,
          }
          state.products.push(created)
          state.createdProducts.push({
            brand: created.brand,
            name: created.name,
            category: created.category,
          })

          return {
            data: {
              id: created.id,
              category: created.category,
              archived_at: created.archived_at,
            },
            error: null,
          }
        }),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve({ data: state.products, error: null }).then(resolve, reject),
      }

      return builder
    }

    if (table === "empties") {
      let mode: "select" | "insert" = "select"
      let insertPayload: Record<string, unknown> | null = null

      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          mode = "insert"
          insertPayload = payload
          return builder
        }),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
          if (mode === "insert" && insertPayload) {
            state.emptyInserts.push(insertPayload)
            state.empties.push({
              product_id: String(insertPayload.product_id),
              finished_year: Number(insertPayload.finished_year),
              finished_month: Number(insertPayload.finished_month),
            })
            return Promise.resolve({ data: null, error: null }).then(resolve, reject)
          }
          return Promise.resolve({ data: state.empties, error: null }).then(resolve, reject)
        },
      }

      return builder
    }

    if (table === "pan_entries") {
      let mode: "select" | "insert" | "delete" = "select"
      let insertPayload: Record<string, unknown> | null = null
      const filters: Record<string, unknown> = {}

      const builder = {
        select: vi.fn().mockImplementation(() => {
          if (mode !== "insert") {
            mode = "select"
          }
          return builder
        }),
        eq: vi.fn().mockImplementation((column: string, value: unknown) => {
          filters[column] = value
          return builder
        }),
        insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          mode = "insert"
          insertPayload = payload
          return builder
        }),
        delete: vi.fn().mockImplementation(() => {
          mode = "delete"
          return builder
        }),
        single: vi.fn().mockImplementation(async () => {
          if (mode !== "insert" || !insertPayload) {
            return { data: null, error: { message: "invalid operation" } }
          }

          state.panInsertCount += 1
          const callIndex = state.panInsertCount

          if (failPanCalls.has(callIndex)) {
            return { data: null, error: { message: "pan insert failed" } }
          }

          const status = String(insertPayload.status ?? "")
          const productId = String(insertPayload.product_id ?? "")
          if (status === "active" && state.activePanProductIds.has(productId)) {
            return { data: null, error: { message: "duplicate active", code: "23505" } }
          }

          state.panInserts.push(insertPayload)
          if (status === "active") {
            state.activePanProductIds.add(productId)
            return { data: { id: `pan-${callIndex}` }, error: null }
          }

          return { data: { id: `pan-${callIndex}` }, error: null }
        }),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
          if (mode === "select") {
            const data =
              filters.status === "active"
                ? Array.from(state.activePanProductIds).map((product_id) => ({ product_id }))
                : []
            return Promise.resolve({ data, error: null }).then(resolve, reject)
          }

          if (mode === "insert" && insertPayload) {
            state.panInsertCount += 1
            const callIndex = state.panInsertCount

            if (failPanCalls.has(callIndex)) {
              return Promise.resolve({ data: null, error: { message: "pan insert failed" } }).then(resolve, reject)
            }

            const status = String(insertPayload.status ?? "")
            const productId = String(insertPayload.product_id ?? "")
            if (status === "active" && state.activePanProductIds.has(productId)) {
              return Promise.resolve({
                data: null,
                error: { message: "duplicate active", code: "23505" },
              }).then(resolve, reject)
            }

            state.panInserts.push(insertPayload)
            if (status === "active") {
              state.activePanProductIds.add(productId)
            }

            return Promise.resolve({ data: { id: `pan-${callIndex}` }, error: null }).then(resolve, reject)
          }

          return Promise.resolve({ data: null, error: null }).then(resolve, reject)
        },
      }

      return builder
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  return { from, state }
}

const NOW = new Date("2026-03-15T00:00:00.000Z")
const USER_ID = "user-1"

describe("previewHistoryCsvImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("skips rows that already exist as empties or active pan", async () => {
    const mock = createDynamicImportSupabase({
      products: [
        {
          id: "prod-1",
          brand: "Rare Beauty",
          name: "Soft Pinch Blush",
          category: "makeup",
          archived_at: null,
        },
        {
          id: "prod-2",
          brand: "Glow Recipe",
          name: "Plum Plump",
          category: "skincare",
          archived_at: null,
        },
      ],
      empties: [{ product_id: "prod-1", finished_year: 2026, finished_month: 2 }],
      activePanProductIds: ["prod-2"],
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "rare beauty,soft pinch blush,makeup,empty,2,2026",
      "Glow Recipe,Plum Plump,skincare,current_pan,,",
      "Tower 28,Lip Gloss,makeup,backlog,,",
    ].join("\n")

    const summary = await previewHistoryCsvImport(USER_ID, csv, NOW)

    expect(summary.imported).toBe(1)
    expect(summary.skipped).toBe(2)
    expect(summary.errors).toEqual([])
    expect(summary.oldestImportedMonth).toBeNull()
  })

  it("uses existing product even when category differs", async () => {
    const mock = createDynamicImportSupabase({
      products: [
        {
          id: "prod-1",
          brand: "Glow Recipe",
          name: "Plum Plump",
          category: "skincare",
          archived_at: null,
        },
      ],
      empties: [],
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "Glow Recipe,Plum Plump,makeup,empty,3,2026",
    ].join("\n")

    const summary = await previewHistoryCsvImport(USER_ID, csv, NOW)
    expect(summary.imported).toBe(1)
    expect(summary.errors).toEqual([])
    expect(summary.skipped).toBe(0)
  })
})

describe("importHistoryCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("imports empty, current_pan, and backlog rows", async () => {
    const mock = createDynamicImportSupabase({
      products: [
        {
          id: "prod-1",
          brand: "Rare Beauty",
          name: "Blush",
          category: "makeup",
          archived_at: null,
        },
      ],
      empties: [],
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const csv = [
      "brand,name,category,status,finished_month,finished_year,rating,would_repurchase,review_notes",
      "Rare Beauty,Blush,makeup,empty,2,2026,5,yes,Still love it",
      "The Ordinary,Niacinamide,skincare,current_pan,3,2026,,,",
      "Tower 28,Lip Gloss,makeup,backlog,,,,,",
    ].join("\n")

    const summary = await importHistoryCsv(USER_ID, csv, NOW)

    expect(summary.imported).toBe(3)
    expect(summary.skipped).toBe(0)
    expect(summary.errors).toEqual([])
    expect(summary.oldestImportedMonth).toBe("2026-02")

    expect(mock.state.createdProducts).toHaveLength(2)
    expect(mock.state.panInserts).toHaveLength(2)
    expect(mock.state.emptyInserts).toHaveLength(1)
    expect(mock.state.panInserts[0]).toMatchObject({
      status: "empty",
      started_month: 2,
      started_year: 2026,
    })
    expect(mock.state.panInserts[1]).toMatchObject({
      status: "active",
      started_month: 3,
      started_year: 2026,
    })
  })

  it("skips current_pan rows when product is already active", async () => {
    const mock = createDynamicImportSupabase({
      products: [
        {
          id: "prod-1",
          brand: "Rare Beauty",
          name: "Blush",
          category: "makeup",
          archived_at: null,
        },
      ],
      empties: [],
      activePanProductIds: ["prod-1"],
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "Rare Beauty,Blush,makeup,current_pan,,",
    ].join("\n")

    const summary = await importHistoryCsv(USER_ID, csv, NOW)
    expect(summary.imported).toBe(0)
    expect(summary.skipped).toBe(1)
    expect(summary.errors).toEqual([])
  })

  it("continues processing rows when one pan insert fails", async () => {
    const mock = createDynamicImportSupabase({
      products: [
        {
          id: "prod-1",
          brand: "Brand 1",
          name: "Product 1",
          category: "makeup",
          archived_at: null,
        },
        {
          id: "prod-2",
          brand: "Brand 2",
          name: "Product 2",
          category: "makeup",
          archived_at: null,
        },
      ],
      empties: [],
      failPanInsertCalls: [1],
    })
    vi.mocked(createClient).mockResolvedValue(mock as never)

    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "Brand 1,Product 1,makeup,empty,2,2026",
      "Brand 2,Product 2,makeup,current_pan,1,2026",
    ].join("\n")

    const summary = await importHistoryCsv(USER_ID, csv, NOW)

    expect(summary.imported).toBe(1)
    expect(summary.errors).toHaveLength(1)
    expect(summary.errors[0]?.message).toContain("Failed to create pan entry")
  })
})
