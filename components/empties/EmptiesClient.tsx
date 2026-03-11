"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { EmptyCard } from "./EmptyCard"
import { CATEGORY_LABELS, ALL_CATEGORIES, MONTH_NAMES } from "@/components/pan/utils"
import type { EmptyCardData } from "./EmptyCard"
import type { ProductCategory } from "@/lib/types/app"

interface MonthYear {
  month: number
  year: number
  label: string
}

interface EmptiesClientProps {
  empties: EmptyCardData[]
}

const PAGE_SIZE = 5

export function EmptiesClient({ empties }: EmptiesClientProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("all") // "all" or "YYYY-MM"
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [visibleByFilter, setVisibleByFilter] = useState({
    key: "all|all",
    count: PAGE_SIZE,
  })

  // Derive unique months from data, sorted newest first
  const monthOptions = useMemo<MonthYear[]>(() => {
    const seen = new Set<string>()
    const options: MonthYear[] = []
    for (const e of empties) {
      const key = `${e.finished_year}-${String(e.finished_month).padStart(2, "0")}`
      if (!seen.has(key)) {
        seen.add(key)
        options.push({
          month: e.finished_month,
          year: e.finished_year,
          label: `${MONTH_NAMES[e.finished_month - 1].slice(0, 3)} ${e.finished_year}`,
        })
      }
    }
    return options
  }, [empties])

  const filtered = useMemo(() => {
    return empties.filter((e) => {
      if (selectedMonth !== "all") {
        const [y, m] = selectedMonth.split("-").map(Number)
        if (e.finished_year !== y || e.finished_month !== m) return false
      }
      if (selectedCategory !== "all") {
        if (e.products?.category !== selectedCategory) return false
      }
      return true
    })
  }, [empties, selectedMonth, selectedCategory])

  const filterKey = `${selectedMonth}|${selectedCategory}`
  const visibleCount = visibleByFilter.key === filterKey ? visibleByFilter.count : PAGE_SIZE

  const visible = filtered.slice(0, visibleCount)
  const remaining = filtered.length - visibleCount

  if (empties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <span className="text-5xl mb-4">💪</span>
        <p className="text-base font-semibold">Nothing finished yet — keep going!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your empties will appear here once you mark products as finished.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-background">
        {/* Month/year chips */}
        <div
          className="flex gap-2 overflow-x-auto px-4 pt-3 pb-2"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          <FilterChip
            label="All time"
            active={selectedMonth === "all"}
            onClick={() => setSelectedMonth("all")}
          />
          {monthOptions.map((mo) => {
            const key = `${mo.year}-${String(mo.month).padStart(2, "0")}`
            return (
              <FilterChip
                key={key}
                label={mo.label}
                active={selectedMonth === key}
                onClick={() => setSelectedMonth(key)}
              />
            )
          })}
        </div>

        {/* Category chips */}
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-3"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          <FilterChip
            label="All categories"
            active={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
          />
          {ALL_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={CATEGORY_LABELS[cat as ProductCategory]}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No empties match these filters.</p>
          </div>
        ) : (
          <>
            {visible.map((empty) => <EmptyCard key={empty.id} empty={empty} />)}
            {remaining > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleByFilter((prev) => {
                      const currentCount = prev.key === filterKey ? prev.count : PAGE_SIZE
                      return { key: filterKey, count: currentCount + PAGE_SIZE }
                    })
                  }
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold text-foreground active:opacity-70"
                >
                Load {Math.min(remaining, PAGE_SIZE)} more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-white text-foreground border border-border"
      )}
      style={{ minHeight: "32px" }}
    >
      {label}
    </button>
  )
}
