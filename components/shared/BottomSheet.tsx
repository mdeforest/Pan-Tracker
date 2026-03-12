"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  maxHeightVh?: number
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  maxHeightVh = 90,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // Visual Viewport API — repositions the sheet so it stays above the keyboard on iOS/Android.
  // When the on-screen keyboard appears, the visual viewport shrinks. We compute the gap between
  // the bottom of the visual viewport and the bottom of the layout viewport, then push the sheet
  // up by that amount so it never hides behind the keyboard.
  useEffect(() => {
    if (!open) return

    const vv = window.visualViewport
    if (!vv) return

    function update() {
      if (!sheetRef.current || !vv) return
      // Distance from bottom of visual viewport to bottom of layout viewport (keyboard height)
      const keyboardHeight = Math.max(0, window.innerHeight - vv.offsetTop - vv.height)
      sheetRef.current.style.bottom = `${keyboardHeight}px`
      // Cap the sheet to both the visible viewport and its configured vh ceiling.
      const maxHeightPx = (window.innerHeight * maxHeightVh) / 100
      sheetRef.current.style.maxHeight = `${Math.min(vv.height, maxHeightPx)}px`
    }

    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    update()

    const sheet = sheetRef.current
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      if (sheet) {
        sheet.style.bottom = ""
        sheet.style.maxHeight = ""
      }
    }
  }, [maxHeightVh, open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-2xl bg-card shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
          className
        )}
        style={{ maxHeight: `${maxHeightVh}dvh` }}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex shrink-0 items-center justify-between px-4 pb-3">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground active:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: footer ? undefined : "env(safe-area-inset-bottom)" }}
        >
          {children}
        </div>

        {/* Sticky footer (outside scroll — always visible) */}
        {footer && (
          <div
            className="shrink-0 border-t border-border px-4 py-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
