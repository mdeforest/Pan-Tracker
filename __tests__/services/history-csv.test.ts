import { describe, expect, it } from "vitest"
import {
  IMPORT_CSV_MAX_BYTES,
  parseHistoryCsvText,
  validateImportCsvFileSize,
} from "@/lib/import/history-csv"

const NOW = new Date("2026-03-15T12:00:00.000Z")

describe("parseHistoryCsvText", () => {
  it("parses valid empty rows including quoted commas", () => {
    const csv = [
      "brand,name,category,status,finished_month,finished_year,rating,would_repurchase,review_notes",
      'Rare Beauty,"Soft Pinch, Liquid Blush",makeup,empty,2,2026,5,yes,"Loved it, would buy again"',
    ].join("\n")

    const result = parseHistoryCsvText(csv, NOW)

    expect(result.errors).toEqual([])
    expect(result.skipped).toBe(0)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      brand: "Rare Beauty",
      name: "Soft Pinch, Liquid Blush",
      category: "makeup",
      status: "empty",
      finishedMonth: 2,
      finishedYear: 2026,
      rating: 5,
      wouldRepurchase: "yes",
      reviewNotes: "Loved it, would buy again",
    })
  })

  it("keeps backward compatibility when status header is omitted", () => {
    const csv = [
      "brand,name,category,finished_month,finished_year",
      "Rare Beauty,Blush,makeup,2,2026",
    ].join("\n")

    const result = parseHistoryCsvText(csv, NOW)
    expect(result.errors).toEqual([])
    expect(result.rows[0]?.status).toBe("empty")
  })

  it("fails when required headers are missing", () => {
    const csv = "brand,name,status,finished_month,finished_year\nRare Beauty,Blush,empty,2,2026"
    const result = parseHistoryCsvText(csv, NOW)

    expect(result.rows).toEqual([])
    expect(result.errors[0]?.message).toContain("Missing required header")
    expect(result.errors[0]?.message).toContain("category")
  })

  it("validates empty-row category, month/year, rating, repurchase, and notes", () => {
    const longNotes = "x".repeat(2001)
    const csv = [
      "brand,name,category,status,finished_month,finished_year,rating,would_repurchase,review_notes",
      `Rare Beauty,Blush,invalid,empty,13,2022,9,definitely,${longNotes}`,
    ].join("\n")

    const result = parseHistoryCsvText(csv, NOW)

    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain("category must be one of")
    expect(result.errors[0]?.message).toContain("finished_month must be an integer from 1 to 12")
    expect(result.errors[0]?.message).toContain("finished date must be between")
    expect(result.errors[0]?.message).toContain("rating must be an integer from 1 to 5")
    expect(result.errors[0]?.message).toContain("would_repurchase must be yes, no, or maybe")
    expect(result.errors[0]?.message).toContain("review_notes must be 2000 characters or fewer")
  })

  it("validates status values", () => {
    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "Rare Beauty,Blush,makeup,weird,2,2026",
    ].join("\n")

    const result = parseHistoryCsvText(csv, NOW)
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]?.message).toContain("status must be one of")
  })

  it("rejects files with more than 500 rows", () => {
    const header = "brand,name,category,status,finished_month,finished_year"
    const lines = Array.from(
      { length: 501 },
      (_, idx) => `Brand ${idx},Name ${idx},makeup,empty,1,2026`
    )
    const csv = [header, ...lines].join("\n")

    const result = parseHistoryCsvText(csv, NOW)

    expect(result.rows).toEqual([])
    expect(result.errors[0]?.message).toContain("at most 500 rows")
  })

  it("uses rolling 36-month window boundaries for dated statuses", () => {
    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "Brand A,Old Allowed,makeup,empty,3,2023",
      "Brand B,Too Old,makeup,current_pan,2,2023",
    ].join("\n")

    const result = parseHistoryCsvText(csv, NOW)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]?.name).toBe("Old Allowed")
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain("finished date must be between 2023-03 and 2026-03")
  })

  it("supports backlog rows without month/year and defaults current_pan dates", () => {
    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "Tower 28,Gloss,makeup,backlog,,",
      "Rare Beauty,Concealer,makeup,current_pan,,",
    ].join("\n")

    const result = parseHistoryCsvText(csv, NOW)

    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      status: "backlog",
      finishedMonth: null,
      finishedYear: null,
    })
    expect(result.rows[1]).toMatchObject({
      status: "current_pan",
      finishedMonth: 3,
      finishedYear: 2026,
    })
  })

  it("skips duplicate rows using status-aware rules", () => {
    const csv = [
      "brand,name,category,status,finished_month,finished_year",
      "Rare Beauty,Blush,makeup,empty,2,2026",
      "rare beauty,blush,makeup,empty,2,2026",
      "Rare Beauty,Blush,makeup,current_pan,,",
      "rare beauty,blush,makeup,current pan,,",
      "Rare Beauty,Blush,makeup,backlog,,",
    ].join("\n")

    const result = parseHistoryCsvText(csv, NOW)

    expect(result.rows).toHaveLength(3)
    expect(result.skipped).toBe(2)
    expect(result.errors).toEqual([])
  })
})

describe("validateImportCsvFileSize", () => {
  it("rejects files over 1MB", () => {
    expect(validateImportCsvFileSize(IMPORT_CSV_MAX_BYTES + 1)).toContain("1 MB")
    expect(validateImportCsvFileSize(IMPORT_CSV_MAX_BYTES)).toBeNull()
  })
})
