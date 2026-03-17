"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TUTORIAL_STEPS } from "@/lib/onboarding/steps"
import { TUTORIAL_EXAMPLES } from "@/lib/onboarding/examples"

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
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isCorner, setIsCorner] = useState(false)

  const step = TUTORIAL_STEPS[currentIndex]
  const isLast = currentIndex === TUTORIAL_STEPS.length - 1
  const example = TUTORIAL_EXAMPLES[currentIndex] ?? null

  // Update spotlight target on step change or resize
  useEffect(() => {
    if (!open) return

    function updateTarget() {
      if (!step.targetId) {
        setTargetRect(null)
        return
      }

      const elements = Array.from(document.querySelectorAll(`[data-tutorial="${step.targetId}"]`))
      const visibleEl = elements.find(el => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })

      if (visibleEl) {
        setTargetRect(visibleEl.getBoundingClientRect())

        // Auto-navigate if the target is a link (nav items)
        const anchor = (visibleEl as HTMLAnchorElement).href
          ? (visibleEl as HTMLAnchorElement)
          : visibleEl.closest("a") as HTMLAnchorElement | null
        if (anchor?.href) {
          router.push(anchor.href)
        }
      } else {
        setTargetRect(null)
      }
    }

    updateTarget()
    window.addEventListener("resize", updateTarget)
    return () => window.removeEventListener("resize", updateTarget)
  }, [currentIndex, step.targetId, open, router])

  if (!open) return null

  function handleNext() {
    if (currentIndex < TUTORIAL_STEPS.length - 1) {
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex((i) => i + 1)
        if (currentIndex === 0) setIsCorner(true)
        setVisible(true)
      }, 200)
    } else {
      markTutorialComplete()
      onClose()
    }
  }

  function handleSkip() {
    markTutorialComplete()
    onClose()
  }

  // Corner mode uses a more compact layout to expose the app UI behind it
  const compact = isCorner

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* SVG Mask Backdrop */}
      <svg
        className="fixed inset-0 z-40 h-full w-full pointer-events-none transition-opacity duration-500 animate-in fade-in"
        aria-hidden="true"
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                fill="black"
                rx="12"
                className="transition-all duration-500 ease-in-out"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          className="fill-background"
          fillOpacity="0.85"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Invisible backdrop click-to-skip */}
      <div className="absolute inset-0 z-40" onClick={handleSkip} />

      {/* Spotlight ring + ping */}
      {targetRect && (
        <div
          className="absolute z-50 pointer-events-none transition-all duration-500 ease-in-out"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        >
          <div className="absolute inset-0 rounded-xl border-2 border-primary animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-xl border-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
        </div>
      )}

      {/* Card — centered on step 0, top-right from step 1 onward */}
      <div
        className={`fixed z-50 rounded-3xl border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center overflow-hidden ${
          compact
            ? "top-4 right-4 left-auto translate-x-0 translate-y-0 w-[85vw] max-w-sm p-5"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md p-8"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div
          className={`flex flex-col items-center w-full transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0"
          } ${compact ? "gap-3" : "gap-5"}`}
        >
          {/* Emoji illustration */}
          <div className="relative">
            {!compact && (
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            )}
            <div
              className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 shadow-inner ${
                compact ? "h-12 w-12 text-2xl" : "h-24 w-24 text-5xl"
              }`}
              aria-hidden="true"
            >
              {step.emoji}
            </div>
          </div>

          {/* Step text */}
          <div className="flex flex-col items-center gap-2">
            <h2
              id="tutorial-title"
              className={`font-bold tracking-tight text-foreground ${compact ? "text-base" : "text-2xl"}`}
            >
              {step.title}
            </h2>
            <p className={`text-muted-foreground leading-relaxed ${compact ? "text-xs" : "text-base"}`}>
              {step.body}
            </p>
          </div>

          {/* Visual example */}
          {example && (
            <div className="w-full">
              {example}
            </div>
          )}

          {/* Dot progress indicator */}
          <div
            className={`flex items-center gap-2 ${compact ? "mt-1" : "mt-2"}`}
            role="tablist"
            aria-label="Tutorial progress"
          >
            {TUTORIAL_STEPS.map((s, i) => (
              <div
                key={s.id}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-5 bg-primary"
                    : i < currentIndex
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div
            className={`flex w-full items-center justify-between gap-4 pt-3 border-t border-border/50 ${
              compact ? "mt-1" : "mt-3"
            }`}
          >
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2 min-h-[44px]"
            >
              Skip tour
            </button>
            <Button
              onClick={handleNext}
              className={`rounded-2xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 ${
                compact ? "h-10 px-5 text-sm" : "h-12 px-8 text-base"
              }`}
            >
              {isLast ? "Done ✓" : "Next →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
