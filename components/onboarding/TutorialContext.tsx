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
  const [sampleId, setSampleId] = useState<string | null>(null)

  // Auto-launch for first-time users. The 600ms delay lets the page paint
  // before the sheet appears, avoiding a jarring flash on mobile.
  useEffect(() => {
    if (!hasSeen) {
      const t = setTimeout(() => {
        handleStartTutorial()
      }, 600)
      return () => clearTimeout(t)
    }
  }, [hasSeen])

  async function handleStartTutorial() {
    try {
      const res = await fetch("/api/tutorial/setup", { method: "POST" })
      const json = await res.json()
      if (json.data) {
        setSampleId(json.data)
      }
    } catch (e) {
      console.error("Failed to setup tutorial sample:", e)
    }
    setOpen(true)
  }

  async function handleCloseTutorial() {
    setOpen(false)
    try {
      await fetch("/api/tutorial/cleanup", { method: "POST" })
      setSampleId(null)
    } catch (e) {
      console.error("Failed to cleanup tutorial sample:", e)
    }
  }

  function startTutorial() {
    handleStartTutorial()
  }

  return (
    <TutorialContext.Provider value={{ startTutorial }}>
      {children}
      {/* key={String(open)} remounts the component on open to reset internal step state */}
      <OnboardingTutorial 
        key={String(open)} 
        open={open} 
        onClose={handleCloseTutorial} 
        sampleId={sampleId} 
      />
    </TutorialContext.Provider>
  )
}
