"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial"

interface TutorialContextValue {
  startTutorial: () => void
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
  const [open, setOpen] = useState(false)

  // Auto-launch for first-time users. The 600ms delay lets the page paint
  // before the sheet appears, avoiding a jarring flash on mobile.
  useEffect(() => {
    if (!hasSeen) {
      const t = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(t)
    }
  }, [hasSeen])

  function startTutorial() {
    setOpen(true)
  }

  return (
    <TutorialContext.Provider value={{ startTutorial }}>
      {children}
      {/* key={String(open)} remounts the component on open to reset internal step state */}
      <OnboardingTutorial key={String(open)} open={open} onClose={() => setOpen(false)} />
    </TutorialContext.Provider>
  )
}
