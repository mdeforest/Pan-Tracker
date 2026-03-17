"use client"

import { useState } from "react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import { Button } from "@/components/ui/button"
import { TUTORIAL_STEPS } from "@/lib/onboarding/steps"

interface OnboardingTutorialProps {
  open: boolean
  onClose: () => void
}

function markTutorialComplete() {
  // Fire-and-forget — don't block the UI on the network request.
  fetch("/api/onboarding", { method: "PATCH" }).catch(() => {
    // Silent fail — tutorial completion is not critical path.
  })
}

export function OnboardingTutorial({ open, onClose }: OnboardingTutorialProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  function handleNext() {
    if (currentIndex < TUTORIAL_STEPS.length - 1) {
      // Brief fade out → advance → fade in
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex((i) => i + 1)
        setVisible(true)
      }, 0)
    } else {
      markTutorialComplete()
      onClose()
    }
  }

  function handleSkip() {
    markTutorialComplete()
    onClose()
  }

  const step = TUTORIAL_STEPS[currentIndex]
  const isLast = currentIndex === TUTORIAL_STEPS.length - 1

  const footer = (
    <div className="flex items-center justify-between px-6 py-4">
      <button
        onClick={handleSkip}
        className="text-sm text-muted-foreground underline-offset-2 hover:underline min-h-[44px] min-w-[44px] flex items-center"
      >
        Skip
      </button>
      <Button onClick={handleNext} className="min-h-[44px] px-6 rounded-xl">
        {isLast ? "Done ✓" : "Next →"}
      </Button>
    </div>
  )

  return (
    <BottomSheet open={open} onClose={handleSkip} maxHeightVh={70} footer={footer}>
      <div
        className={`flex flex-col items-center gap-4 px-6 pb-2 pt-6 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Emoji illustration */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-4xl"
          aria-hidden="true"
        >
          {step.emoji}
        </div>

        {/* Step text */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl font-bold tracking-tight">{step.title}</h2>
          <p className="text-base text-foreground/70 leading-relaxed max-w-xs">{step.body}</p>
        </div>

        {/* Dot progress indicator */}
        <div
          className="flex items-center gap-1.5 mt-2"
          role="tablist"
          aria-label="Tutorial progress"
        >
          {TUTORIAL_STEPS.map((s, i) => (
            <div
              key={s.id}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Step ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                i <= currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}
