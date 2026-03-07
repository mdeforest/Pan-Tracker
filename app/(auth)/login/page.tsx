"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">PanTracker</h1>
          <p className="text-sm text-muted-foreground">
            Track your project pan journey
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            Sign-in failed. Please try again.
          </p>
        )}

        <Button onClick={signInWithGoogle} className="w-full" size="lg">
          Sign in with Google
        </Button>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
