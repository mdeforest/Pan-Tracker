import { describe, expect, it } from "vitest"
import { getSafeRedirectPath } from "@/lib/utils"

describe("getSafeRedirectPath", () => {
  it("returns the provided path when it is a local absolute path", () => {
    expect(getSafeRedirectPath("/pan/2026/3", "/fallback")).toBe("/pan/2026/3")
  })

  it("falls back for protocol-relative paths", () => {
    expect(getSafeRedirectPath("//evil.example", "/fallback")).toBe("/fallback")
  })

  it("falls back for non-path redirect targets", () => {
    expect(getSafeRedirectPath("https://evil.example", "/fallback")).toBe("/fallback")
  })

  it("falls back for backslash-based paths", () => {
    expect(getSafeRedirectPath("/\\evil", "/fallback")).toBe("/fallback")
  })
})
