"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TUTORIAL_STEPS } from "@/lib/onboarding/steps"

interface OnboardingTutorialProps {
  open: boolean
  onClose: () => void
  sampleId?: string | null
}

function markTutorialComplete() {
  // Fire-and-forget — don't block the UI on the network request.
  fetch("/api/onboarding", { method: "PATCH" }).catch(() => {
    // Silent fail — tutorial completion is not critical path.
  })
}

export function OnboardingTutorial({ open, onClose, sampleId }: OnboardingTutorialProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isCorner, setIsCorner] = useState(false)
  
  // Interactive mock state
  const [mockUsage, setMockUsage] = useState(0)
  const [mockIsPick, setMockIsPick] = useState(false)
  
  const step = TUTORIAL_STEPS[currentIndex]
  const isLast = currentIndex === TUTORIAL_STEPS.length - 1

  // Update spotlight target on step change or resize
  useEffect(() => {
    if (!open) return

    function updateTarget() {
      if (!step.targetId) {
        setTargetRect(null)
        return
      }

      // Collect all matching elements
      const elements = Array.from(document.querySelectorAll(`[data-tutorial="${step.targetId}"]`))
      
      // Find the one that is currently visible / not hidden by CSS display: none
      // A quick heuristic: offsetParent !== null or bounding rect width > 0
      const visibleEl = elements.find(el => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })

      if (visibleEl) {
        setTargetRect(visibleEl.getBoundingClientRect())

        // Auto-navigate to the target page if it's a link
        const anchor = (visibleEl as HTMLAnchorElement).href ? (visibleEl as HTMLAnchorElement) : visibleEl.closest('a') as HTMLAnchorElement | null
        if (anchor && anchor.href) {
          router.push(anchor.href)
        }
      } else {
        setTargetRect(null)
      }
    }

    updateTarget()
    
    // Also track window resizes to move spotlight
    window.addEventListener("resize", updateTarget)
    return () => window.removeEventListener("resize", updateTarget)
  }, [currentIndex, step.targetId, open, router])

  if (!open) return null

  function handleNext() {
    if (currentIndex < TUTORIAL_STEPS.length - 1) {
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex((i) => i + 1)
        // Snap to corner while the card is invisible — no jarring jump
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

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* SVG Mask Backdrop (no blur, completely clear over spotlight) */}
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
      
      {/* Invisible click handler over the backdrop area */}
      <div className="absolute inset-0 z-40" onClick={handleSkip} />

      {/* Spotlight Ping if applicable */}
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

      {/* Card UI — centered on step 0, top-right from step 1 onward */}
      <div
        className={`fixed z-50 w-[90vw] max-w-md rounded-3xl border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-500 p-8 flex flex-col items-center text-center overflow-hidden ${
          isCorner
            ? "top-4 right-4 left-auto translate-x-0 translate-y-0"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div
          className={`flex flex-col items-center gap-6 w-full transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Glowing Emoji illustration */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 text-5xl shadow-inner"
              aria-hidden="true"
            >
              {step.emoji}
            </div>
          </div>

          {/* Step text */}
          <div className="flex flex-col items-center gap-3">
            <h2 id="tutorial-title" className="text-2xl font-bold tracking-tight text-foreground">
              {step.title}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {step.body}
            </p>
          </div>

          {/* Interactive Examples */}
          {step.renderExample && (
            <div className="w-full mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {step.id === "pan" && (
                <div className="mx-auto w-[65%] pointer-events-none transform rotate-1">
                  <div className="group relative flex w-full flex-col rounded-3xl bg-card ring-1 ring-gray-100 shadow-md text-left overflow-hidden">
                    <div className="relative w-full aspect-square bg-muted overflow-hidden flex items-center justify-center">
                      <span className="text-5xl opacity-60">🧴</span>
                      <span className="absolute bottom-2 left-2 rounded-full bg-zinc-500 px-3 py-2 text-[11px] font-medium leading-none text-white shadow-sm">
                        skincare
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide leading-tight line-clamp-2 text-foreground">
                        Tutorial Sample Product
                      </p>
                      <div className="space-y-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all w-[90%]" />
                        </div>
                        <p className="text-[10px] font-semibold text-primary">90%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step.id === "logging-progress" && (
                <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border text-left">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try it!</span>
                    <span className="text-lg font-bold">
                      {[10, 25, 50, 75, 90][mockUsage]}%
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted mb-4">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all bg-primary"
                      style={{ width: `${[10, 25, 50, 75, 90][mockUsage]}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={4 - mockUsage}
                    onChange={(e) => setMockUsage(4 - parseInt(e.target.value, 10))}
                    className="w-full accent-primary appearance-none bg-muted h-2 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary"
                    aria-label="Try usage slider"
                  />
                  <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-medium text-muted-foreground">
                    <span>Empty</span>
                    <span>Low</span>
                    <span>Half</span>
                    <span>Most</span>
                    <span>Full</span>
                  </div>
                </div>
              )}

              {step.id === "monthly-picks" && (
                <div className="flex items-center justify-between rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mark as pick</span>
                    <span className="text-sm font-medium">Tap the star to toggle</span>
                  </div>
                  <button
                    onClick={() => setMockIsPick(!mockIsPick)}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                      mockIsPick
                        ? "bg-amber-100 text-amber-500 scale-110"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={mockIsPick ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
              )}

              {step.id === "logging-empty" && (
                <div className="rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border flex flex-col gap-2 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                      🎉
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-green-700">Empty Logged!</span>
                      <span className="text-xs text-muted-foreground text-left">Moved to your Empties Log ✓</span>
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-green-50 rounded-full blur-2xl pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* Dot progress indicator */}
          <div
            className="flex items-center gap-2 mt-4"
            role="tablist"
            aria-label="Tutorial progress"
          >
            {TUTORIAL_STEPS.map((s, i) => (
              <div
                key={s.id}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Step ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex 
                    ? "w-6 bg-primary" 
                    : i < currentIndex
                      ? "w-2 bg-primary/40"
                      : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex w-full items-center justify-between gap-4 mt-6 pt-4 border-t border-border/50">
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Skip tour
            </button>
            <Button 
              onClick={handleNext} 
              className="h-12 px-8 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
            >
              {isLast ? "Done ✓" : "Next →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
