"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { currentYearMonth } from "@/lib/utils"
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial"

interface TutorialContextValue {
  startTutorial: () => void
  demoProductId: string | null
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error("useTutorial must be used inside TutorialProvider")
  return ctx
}

interface TutorialProviderProps {
  hasSeen: boolean
  children: React.ReactNode
}

export function TutorialProvider({ hasSeen, children }: TutorialProviderProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [demoProductId, setDemoProductId] = useState<string | null>(null)
  const demoPanEntryIdRef = useRef<string | null>(null)

  async function openTutorial() {
    setOpen(true)

    // Create demo data so there's a real product to spotlight in the pan.
    const { year, month } = currentYearMonth()
    try {
      const res = await fetch("/api/tutorial/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      })
      const json = await res.json() as { data: { productId: string; panEntryId: string } | null; error: string | null }
      if (json.data) {
        setDemoProductId(json.data.productId)
        demoPanEntryIdRef.current = json.data.panEntryId
        // Refresh so the demo card appears in the pan grid
        router.refresh()
      }
    } catch {
      // Non-critical — tutorial continues without a spotlight target
    }
  }

  // Auto-launch for first-time users. 600ms lets the page paint first.
  useEffect(() => {
    if (!hasSeen) {
      const t = setTimeout(() => openTutorial(), 600)
      return () => clearTimeout(t)
    }
  }, [hasSeen]) // eslint-disable-line react-hooks/exhaustive-deps

  async function closeTutorial() {
    setOpen(false)

    // Clean up demo data, if any was created
    const panEntryId = demoPanEntryIdRef.current
    const productId = demoProductId

    setDemoProductId(null)
    demoPanEntryIdRef.current = null

    if (panEntryId && productId) {
      try {
        await fetch("/api/tutorial/cleanup", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ panEntryId, productId }),
        })
        router.refresh()
      } catch {
        // Silent fail — orphaned demo data is benign (visible as "Tutorial Blush" in library)
      }
    }
  }

  function startTutorial() {
    openTutorial()
  }

  return (
    <TutorialContext.Provider value={{ startTutorial, demoProductId }}>
      {children}
      {/* key={String(open)} remounts OnboardingTutorial on each open to reset step state */}
      <OnboardingTutorial key={String(open)} open={open} onClose={closeTutorial} />
    </TutorialContext.Provider>
  )
}
