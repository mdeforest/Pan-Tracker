"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const LOCAL_EMAIL_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_EMAIL_AUTH === "true" &&
  /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")

function LoginContent() {
  const searchParams = useSearchParams()
  const oauthError = searchParams.get("error")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  async function signInWithPassword() {
    if (!email.trim() || !password) {
      setLocalError("Email and password are required.")
      return
    }

    setSubmitting(true)
    setLocalError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setLocalError(error.message)
        return
      }

      window.location.assign("/")
    } catch {
      setLocalError("Sign-in failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">PanTracker</h1>
          <p className="text-sm text-muted-foreground">
            Track your project pan journey
          </p>
        </div>

        {oauthError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            Sign-in failed. Please try again.
          </p>
        )}

        <Button onClick={signInWithGoogle} className="w-full rounded-xl" size="lg">
          Sign in with Google
        </Button>

        {LOCAL_EMAIL_AUTH_ENABLED && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Local only
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo-pan@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void signInWithPassword()
                    }
                  }}
                  placeholder="password123"
                />
              </div>
            </div>

            {localError && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                {localError}
              </p>
            )}

            <Button
              onClick={signInWithPassword}
              className="w-full rounded-xl"
              size="lg"
              variant="outline"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in with Email"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Local development only. Hidden unless `NEXT_PUBLIC_ENABLE_LOCAL_EMAIL_AUTH=true`
              and Supabase is running on `localhost`.
            </p>
          </div>
        )}
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
