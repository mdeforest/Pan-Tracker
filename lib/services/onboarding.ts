import { createClient } from "@/lib/supabase/server"

interface ServiceError {
  message: string
}

/**
 * Returns whether the given user has already completed (or skipped) the tutorial.
 * hasSeen = true if onboarding_completed_at is non-null.
 */
export async function getOnboardingStatus(userId: string): Promise<{
  data: { hasSeen: boolean } | null
  error: ServiceError | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("users")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("getOnboardingStatus error", { userId, message: error.message })
    return { data: null, error: { message: error.message } }
  }

  return {
    data: { hasSeen: data.onboarding_completed_at !== null },
    error: null,
  }
}

/**
 * Marks the tutorial as completed for the given user by setting
 * onboarding_completed_at to the current timestamp.
 */
export async function completeOnboarding(userId: string): Promise<{
  data: { onboarding_completed_at: string } | null
  error: ServiceError | null
}> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("users")
    .update({ onboarding_completed_at: now })
    .eq("id", userId)
    .select("onboarding_completed_at")
    .single()

  if (error) {
    console.error("completeOnboarding error", { userId, message: error.message })
    return { data: null, error: { message: error.message } }
  }

  return {
    data: { onboarding_completed_at: data.onboarding_completed_at ?? now },
    error: null,
  }
}
