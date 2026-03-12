"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const LOCAL_EMAIL_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_EMAIL_AUTH === "true" &&
  /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function BrandIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="6.1" y="1.8" width="3.8" height="2.1" rx="0.7" fill="currentColor" />
      <rect x="4.3" y="3.9" width="7.4" height="10.1" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.3 8h3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="10.6" r="1.05" fill="currentColor" />
      <path d="M11.7 2.4v1.2M11.1 3h1.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

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
    <div className="flex min-h-screen bg-white">
      {/* Left branding panel — hidden on mobile, visible md+ */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-between bg-[oklch(0.96_0.015_75)] p-10 lg:p-14">
        <div className="mx-auto w-[72%] space-y-8 lg:w-[70%]">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BrandIcon className="h-4 w-4 invert" />
            </div>
            <span className="text-base font-bold text-foreground">PanTracker</span>
          </div>

          {/* Hero image */}
          <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-sm aspect-[4/4.3]">
            <Image
              src="/images/login-hero-beauty.png"
              alt="Beauty products arranged on a vanity"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 35vw"
            />
          </div>

          {/* Hero text */}
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Track your progress.<br />Hit the pan.
            </h1>
            <p className="text-base text-muted-foreground">
              Manage your beauty collection, track usage, and conquer your Project Pan goals with ease.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mx-auto w-[72%] text-xs text-muted-foreground lg:w-[70%]">
          © 2026 PanTracker. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo (hidden on md+) */}
          <div className="flex flex-col items-start gap-6 md:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md">
              <BrandIcon className="h-8 w-8 invert" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Welcome to PanTracker
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Please sign in to continue tracking your progress.
              </p>
            </div>
          </div>

          {/* Desktop heading (hidden on mobile) */}
          <div className="hidden md:block">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ready to record today&apos;s usage?</p>
          </div>

          {/* Error */}
          {oauthError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              Sign-in failed. Please try again.
            </p>
          )}

          {/* Google sign-in */}
          <div className="space-y-3">
            <button
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted active:scale-[0.98]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>

          {/* Local email/password (dev only) */}
          {LOCAL_EMAIL_AUTH_ENABLED && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Local development only
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
                Local development only. Hidden unless{" "}
                <code>NEXT_PUBLIC_ENABLE_LOCAL_EMAIL_AUTH=true</code> and Supabase is running on{" "}
                <code>localhost</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
