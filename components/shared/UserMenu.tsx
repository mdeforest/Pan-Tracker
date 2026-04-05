"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import { useTutorial } from "@/components/onboarding/TutorialContext"
import { ImportCollectionSheet } from "@/components/import/ImportCollectionSheet"

interface UserMenuProps {
  avatarUrl: string | null
  name: string | null
}

export function UserMenu({ avatarUrl, name }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [collectionSheetOpen, setCollectionSheetOpen] = useState(false)
  const { startTutorial } = useTutorial()
  const router = useRouter()

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name ?? "User avatar"}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 w-52 rounded-lg border bg-background shadow-lg">
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
            >
              Help
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
            >
              Wishlist
            </Link>
            <Link
              href="/import/csv"
              onClick={() => setOpen(false)}
              className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
            >
              Import History
            </Link>
            <button
              onClick={() => { setCollectionSheetOpen(true); setOpen(false) }}
              className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
            >
              Import Collection
            </button>
            <button
              onClick={() => { startTutorial(); setOpen(false) }}
              className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
            >
              Take the Tour
            </button>
            <form action={signOut} className="contents">
              <button
                type="submit"
                className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      )}

      <ImportCollectionSheet
        open={collectionSheetOpen}
        onClose={() => setCollectionSheetOpen(false)}
        onImported={() => router.refresh()}
      />
    </div>
  )
}
