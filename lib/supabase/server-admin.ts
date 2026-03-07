import { createClient } from "@supabase/supabase-js"
import { type Database } from "@/lib/types/database"

/**
 * Service-role Supabase client — bypasses RLS.
 * ONLY import in app/api/ route handlers. Never in components or pages.
 * Required for admin operations like storage uploads and cross-user queries.
 */
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
