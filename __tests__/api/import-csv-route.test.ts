import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/import-history", () => ({
  previewHistoryCsvImport: vi.fn(),
  importHistoryCsv: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForEmptiesMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { previewHistoryCsvImport, importHistoryCsv } from "@/lib/services/import-history"
import { revalidateForEmptiesMutation } from "@/lib/cache/tab-cache"
import { POST } from "@/app/api/import/csv/route"

const USER_ID = "11111111-1111-1111-1111-111111111111"

function makeCsvRequest(url: string) {
  const formData = new FormData()
  formData.append(
    "file",
    new File(
      ["brand,name,category,finished_month,finished_year\nRare Beauty,Blush,makeup,2,2026"],
      "history.csv",
      { type: "text/csv" }
    )
  )
  return new NextRequest(url, { method: "POST", body: formData })
}

describe("POST /api/import/csv", () => {
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

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never)

    const res = await POST(makeCsvRequest("http://localhost/api/import/csv?mode=preview"))
    expect(res.status).toBe(401)
  })

  it("returns 400 when mode is invalid", async () => {
    const res = await POST(makeCsvRequest("http://localhost/api/import/csv?mode=unknown"))
    expect(res.status).toBe(400)
  })

  it("returns 400 when file is missing", async () => {
    const req = new NextRequest("http://localhost/api/import/csv?mode=preview", {
      method: "POST",
      body: new FormData(),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("runs preview mode without revalidation", async () => {
    vi.mocked(previewHistoryCsvImport).mockResolvedValue({
      imported: 2,
      skipped: 1,
      errors: [],
      oldestImportedMonth: "2025-09",
    })

    const res = await POST(makeCsvRequest("http://localhost/api/import/csv?mode=preview"))

    expect(res.status).toBe(200)
    expect(previewHistoryCsvImport).toHaveBeenCalledWith(
      USER_ID,
      expect.stringContaining("brand,name,category")
    )
    expect(importHistoryCsv).not.toHaveBeenCalled()
    expect(revalidateForEmptiesMutation).not.toHaveBeenCalled()
  })

  it("runs import mode and revalidates on successful import", async () => {
    vi.mocked(importHistoryCsv).mockResolvedValue({
      imported: 1,
      skipped: 0,
      errors: [],
      oldestImportedMonth: "2026-02",
    })

    const res = await POST(makeCsvRequest("http://localhost/api/import/csv?mode=import"))

    expect(res.status).toBe(200)
    expect(importHistoryCsv).toHaveBeenCalledWith(
      USER_ID,
      expect.stringContaining("Rare Beauty,Blush")
    )
    expect(revalidateForEmptiesMutation).toHaveBeenCalledWith(USER_ID)
  })
})
