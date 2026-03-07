import { vi } from "vitest"

export type MockResult<T = unknown> = { data: T | null; error: { message: string; code?: string } | null }

/**
 * Creates a chainable Supabase query builder mock.
 * The builder is awaitable (resolves to `result`) and has a `.single()` terminal method.
 */
export function createQueryBuilder<T>(result: MockResult<T>) {
  const self = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    // terminal: single-row queries
    single: vi.fn().mockResolvedValue(result),
    // make the builder itself awaitable (for list queries)
    then: (
      resolve: (v: MockResult<T>) => unknown,
      reject?: (e: unknown) => unknown
    ) => Promise.resolve(result).then(resolve, reject),
  }
  return self
}

export type QueryBuilderMock = ReturnType<typeof createQueryBuilder>

/**
 * Creates a mock Supabase client where each table gets its own query builder.
 * Pass a map of table name → mock result.
 */
export function createMockSupabase(tableResults: Record<string, MockResult>) {
  const builders: Record<string, QueryBuilderMock> = {}

  const from = vi.fn().mockImplementation((table: string) => {
    if (!builders[table]) {
      builders[table] = createQueryBuilder(tableResults[table] ?? { data: null, error: null })
    }
    return builders[table]
  })

  return { from, _builders: builders }
}

/**
 * Creates a mock Supabase Storage bucket with upload + getPublicUrl.
 */
export function createMockStorageBucket(uploadError: null | { message: string } = null) {
  return {
    upload: vi.fn().mockResolvedValue({ error: uploadError }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/product-photos/user/123.jpg" },
    }),
  }
}

export function createMockAdminClient(
  tableResults: Record<string, MockResult> = {},
  storageBucket = createMockStorageBucket()
) {
  const dbClient = createMockSupabase(tableResults)
  return {
    from: dbClient.from,
    _builders: dbClient._builders,
    storage: {
      from: vi.fn().mockReturnValue(storageBucket),
      _bucket: storageBucket,
    },
  }
}
