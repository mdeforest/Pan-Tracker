import { describe, expect, it } from "vitest"
import {
  autoSplitBrand,
  computeExpirationDate,
  detectCategoryFromFilename,
  detectSophiaFormat,
  parseCollectionCsv,
  parseSophiaDate,
} from "@/lib/import/collection-csv"

const NOW = new Date("2026-04-05T12:00:00.000Z")

describe("parseSophiaDate", () => {
  it("parses full date string", () => {
    expect(parseSophiaDate("September 1, 2023")).toBe("2023-09-01")
  })

  it("parses month-year only", () => {
    expect(parseSophiaDate("March, 2024")).toBe("2024-03-01")
  })

  it("parses month year without comma", () => {
    expect(parseSophiaDate("March 2024")).toBe("2024-03-01")
  })

  it("parses date with leading zero day", () => {
    expect(parseSophiaDate("January 01, 2027")).toBe("2027-01-01")
  })

  it("returns null for Unknown", () => {
    expect(parseSophiaDate("Unknown")).toBeNull()
  })

  it("returns null for blank string", () => {
    expect(parseSophiaDate("")).toBeNull()
  })
})

describe("computeExpirationDate", () => {
  it("uses expiration date when provided and valid", () => {
    expect(
      computeExpirationDate("October 1, 2026", "October 1, 2024", NOW)
    ).toBe("2026-10-01")
  })

  it("falls back to manufacture date + 1 year when expiry is missing", () => {
    expect(computeExpirationDate(null, "October 1, 2024", NOW)).toBe("2025-10-01")
  })

  it("falls back to today + 1 year when both are missing", () => {
    expect(computeExpirationDate(null, null, NOW)).toBe("2027-04-05")
  })

  it("falls back to manufacture date + 1 year when expiry is Unknown", () => {
    expect(computeExpirationDate("Unknown", "October 1, 2024", NOW)).toBe("2025-10-01")
  })
})

describe("autoSplitBrand", () => {
  it("splits a known brand from the start of the string", () => {
    expect(autoSplitBrand("Tatcha Duo Rice Cleanse")).toEqual({
      brand: "Tatcha",
      name: "Duo Rice Cleanse",
    })
  })

  it("handles multi-word brands", () => {
    expect(autoSplitBrand("Estée Lauder Advanced Night Repair")).toEqual({
      brand: "Estée Lauder",
      name: "Advanced Night Repair",
    })
  })

  it("is case-insensitive", () => {
    expect(autoSplitBrand("TATCHA Duo Rice Cleanse")).toEqual({
      brand: "Tatcha",
      name: "Duo Rice Cleanse",
    })
  })

  it("returns null for unknown brand", () => {
    expect(autoSplitBrand("Some Unknown Brand Product")).toBeNull()
  })
})

describe("detectCategoryFromFilename", () => {
  it("detects mascara from mascara filename", () => {
    expect(
      detectCategoryFromFilename("Project Pan Products Master List - Mascara.csv")
    ).toBe("mascara")
  })

  it("detects serum from serums filename", () => {
    expect(
      detectCategoryFromFilename("Project Pan Products Master List - Serums.csv")
    ).toBe("serum")
  })

  it("returns null for unrecognized filename", () => {
    expect(detectCategoryFromFilename("random-file.csv")).toBeNull()
  })
})

describe("detectSophiaFormat", () => {
  it("returns true for Sophia headers", () => {
    expect(
      detectSophiaFormat(["Product", "Product Size/Weight", "Manufacture Date"])
    ).toBe(true)
  })

  it("returns false when brand/name columns are present", () => {
    expect(
      detectSophiaFormat(["brand", "name", "category"])
    ).toBe(false)
  })

  it("returns false when product header is absent", () => {
    expect(
      detectSophiaFormat(["Brand", "Name", "Manufacture Date"])
    ).toBe(false)
  })

  it("handles headers with extra whitespace", () => {
    expect(
      detectSophiaFormat(["  Product  ", "Product Size/Weight"])
    ).toBe(true)
  })
})

describe("parseCollectionCsv", () => {
  const SAMPLE_CSV = [
    "Product,Product Size/Weight,Manufacture Date,Date in Collection,Expiration Date,,Key,finished",
    'Tatcha Duo Rice Cleanse,1.7 oz,"July 1, 2024",Unknown,"July 1, 2027",,,',
    'L\'Oreal Lash Paradise,0.15 oz,"March, 2024",,,,, yes',
    "Some Unknown Brand Product,0.5 oz,,,,,, ",
  ].join("\n")

  it("returns error when Product column is missing", () => {
    const result = parseCollectionCsv("brand,name\nRare Beauty,Blush", "mascara", NOW)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain("Product")
  })

  it("parses rows with known and unknown brands", () => {
    const result = parseCollectionCsv(SAMPLE_CSV, "serum", NOW)

    expect(result.errors).toHaveLength(0)
    expect(result.rows).toHaveLength(3)
    expect(result.autoMatchedCount).toBe(2)
  })

  it("assigns the provided category to all rows", () => {
    const result = parseCollectionCsv(SAMPLE_CSV, "serum", NOW)
    expect(result.rows.every((r) => r.category === "serum")).toBe(true)
  })

  it("marks finished rows correctly", () => {
    const result = parseCollectionCsv(SAMPLE_CSV, "mascara", NOW)
    const lOreal = result.rows.find((r) => r.productString.startsWith("L'Oreal"))
    expect(lOreal?.isFinished).toBe(true)
  })

  it("auto-splits known brands", () => {
    const result = parseCollectionCsv(SAMPLE_CSV, "mascara", NOW)
    const tatcha = result.rows.find((r) => r.productString.startsWith("Tatcha"))
    expect(tatcha?.brand).toBe("Tatcha")
    expect(tatcha?.name).toBe("Duo Rice Cleanse")
    expect(tatcha?.autoMatched).toBe(true)
  })

  it("leaves brand blank for unrecognized products", () => {
    const result = parseCollectionCsv(SAMPLE_CSV, "mascara", NOW)
    const unknown = result.rows.find((r) => r.productString.startsWith("Some Unknown"))
    expect(unknown?.brand).toBe("")
    expect(unknown?.name).toBe("Some Unknown Brand Product")
    expect(unknown?.autoMatched).toBe(false)
  })

  it("computes expiration date from expiration column when present", () => {
    const result = parseCollectionCsv(SAMPLE_CSV, "serum", NOW)
    const tatcha = result.rows.find((r) => r.productString.startsWith("Tatcha"))
    expect(tatcha?.expirationDate).toBe("2027-07-01")
  })

  it("skips Wish List section header rows", () => {
    const csv = [
      "Product,finished",
      "Tatcha Cleanser,",
      "Wish List ,",
      "Some Brand Product,",
    ].join("\n")
    const result = parseCollectionCsv(csv, "serum", NOW)
    expect(result.rows).toHaveLength(2)
    expect(result.rows.some((r) => r.productString === "Wish List")).toBe(false)
  })

  it("returns error for empty CSV input", () => {
    const result = parseCollectionCsv("", "serum", NOW)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain("empty")
  })
})
