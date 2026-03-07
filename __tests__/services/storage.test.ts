import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockAdminClient, createMockStorageBucket } from "../helpers/supabase-mock"

vi.mock("@/lib/supabase/server-admin", () => ({ createAdminClient: vi.fn() }))

import { createAdminClient } from "@/lib/supabase/server-admin"
import { validatePhotoFile, uploadProductPhoto } from "@/lib/services/storage"

const USER_ID = "user-111"

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

describe("validatePhotoFile", () => {
  it("returns null for a valid JPEG", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 1024)
    expect(validatePhotoFile(file)).toBeNull()
  })

  it("returns null for a valid PNG", () => {
    const file = makeFile("photo.png", "image/png", 1024)
    expect(validatePhotoFile(file)).toBeNull()
  })

  it("returns null for a valid WebP", () => {
    const file = makeFile("photo.webp", "image/webp", 1024)
    expect(validatePhotoFile(file)).toBeNull()
  })

  it("returns an error for an unsupported type", () => {
    const file = makeFile("photo.gif", "image/gif", 1024)
    expect(validatePhotoFile(file)).toMatch(/JPEG|PNG|WebP/)
  })

  it("returns an error for a PDF", () => {
    const file = makeFile("doc.pdf", "application/pdf", 1024)
    expect(validatePhotoFile(file)).toMatch(/JPEG|PNG|WebP/)
  })

  it("returns an error for a file larger than 5MB", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 6 * 1024 * 1024)
    expect(validatePhotoFile(file)).toMatch(/5 MB/)
  })

  it("returns null for a file exactly at the 5MB limit", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 5 * 1024 * 1024)
    expect(validatePhotoFile(file)).toBeNull()
  })
})

describe("uploadProductPhoto", () => {
  beforeEach(() => vi.clearAllMocks())

  it("uploads file and returns public URL", async () => {
    const bucket = createMockStorageBucket(null)
    const adminMock = createMockAdminClient({}, bucket)
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    const file = makeFile("photo.jpg", "image/jpeg", 1024)
    const { data, error } = await uploadProductPhoto(file, USER_ID)

    expect(error).toBeNull()
    expect(data?.url).toContain("product-photos")
    expect(adminMock.storage.from).toHaveBeenCalledWith("product-photos")
    expect(bucket.upload).toHaveBeenCalled()
    expect(bucket.getPublicUrl).toHaveBeenCalled()
  })

  it("returns error when storage upload fails", async () => {
    const bucket = createMockStorageBucket({ message: "storage error" })
    const adminMock = createMockAdminClient({}, bucket)
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    const file = makeFile("photo.jpg", "image/jpeg", 1024)
    const { data, error } = await uploadProductPhoto(file, USER_ID)

    expect(data).toBeNull()
    expect(error).toBe("storage error")
    expect(bucket.getPublicUrl).not.toHaveBeenCalled()
  })

  it("uses a path scoped to the user's ID", async () => {
    const bucket = createMockStorageBucket(null)
    const adminMock = createMockAdminClient({}, bucket)
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    const file = makeFile("photo.jpg", "image/jpeg", 1024)
    await uploadProductPhoto(file, USER_ID)

    const [uploadPath] = bucket.upload.mock.calls[0] as [string, ...unknown[]]
    expect(uploadPath).toMatch(new RegExp(`^${USER_ID}/`))
  })
})
