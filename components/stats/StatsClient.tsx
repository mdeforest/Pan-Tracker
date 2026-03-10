"use client"

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { StatsData } from "@/lib/services/stats"
import type { ProductCategory } from "@/lib/types/app"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  makeup: "#f472b6",
  skincare: "#34d399",
  haircare: "#a78bfa",
  bodycare: "#fb923c",
  fragrance: "#38bdf8",
  tools: "#94a3b8",
  other: "#d1d5db",
}

const TREND_COLOR = "#a78bfa"

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-4 mx-4 mb-4 ${className}`}>
      {children}
    </div>
  )
}

function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold text-muted-foreground mb-3">{children}</p>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 pt-16 pb-8 text-center">
      <div className="text-5xl mb-4">✨</div>
      <p className="text-lg font-bold tracking-tight mb-2">No stats yet</p>
      <p className="text-sm text-muted-foreground">
        Log your first empty product to start seeing your panning progress here.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Streak hero
// ---------------------------------------------------------------------------

function StreakCard({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number
  longestStreak: number
}) {
  const streakEmoji = currentStreak >= 6 ? "🔥" : currentStreak >= 3 ? "⚡" : "✨"

  return (
    <Card>
      <CardHeading>Pan streak</CardHeading>
      <div className="flex items-end gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">
              {currentStreak}
            </span>
            <span className="text-base text-muted-foreground">
              {currentStreak === 1 ? "month" : "months"} {streakEmoji}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">current streak</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold tracking-tight">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">best ever</p>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Total empties
// ---------------------------------------------------------------------------

function TotalEmptiesCard({ total }: { total: number }) {
  return (
    <Card>
      <CardHeading>Total empties</CardHeading>
      <p className="text-4xl font-bold tracking-tight">{total}</p>
      <p className="text-xs text-muted-foreground mt-1">
        product{total === 1 ? "" : "s"} finished all-time
      </p>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Monthly trend chart
// ---------------------------------------------------------------------------

function MonthlyTrendChart({ data }: { data: StatsData["monthlyTrend"] }) {
  return (
    <Card>
      <CardHeading>Monthly empties (last 12 months)</CardHeading>
      <div className="w-full h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "none",
                boxShadow: "0 1px 8px rgba(0,0,0,0.10)",
                fontSize: 12,
              }}
              formatter={(value) => [value ?? 0, "empties"]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="count" fill={TREND_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Category breakdown chart (horizontal bars)
// ---------------------------------------------------------------------------

function CategoryBreakdownChart({
  data,
}: {
  data: StatsData["categoryBreakdown"]
}) {
  if (data.length === 0) return null

  // Height: 40px per bar + padding
  const chartHeight = Math.max(160, data.length * 44)

  return (
    <Card>
      <CardHeading>Empties by category</CardHeading>
      <div className="w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 8, bottom: 0, left: 4 }}
          >
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={72}
              tick={{ fontSize: 11, fill: "#374151" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "none",
                boxShadow: "0 1px 8px rgba(0,0,0,0.10)",
                fontSize: 12,
              }}
              formatter={(value) => [value ?? 0, "empties"]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[entry.category]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Top brands list
// ---------------------------------------------------------------------------

function TopBrandsCard({ brands }: { brands: StatsData["topBrands"] }) {
  if (brands.length === 0) return null

  return (
    <Card>
      <CardHeading>Most panned brands</CardHeading>
      <ol className="flex flex-col gap-3">
        {brands.map((item, idx) => (
          <li key={item.brand} className="flex items-center gap-3 min-h-[44px]">
            <span className="text-sm font-bold text-muted-foreground w-5 text-center flex-shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1 text-sm font-medium truncate">{item.brand}</span>
            <span className="flex-shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
              {item.count}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Average time to pan
// ---------------------------------------------------------------------------

function AvgTimeToPanCard({ data }: { data: StatsData["avgTimeByCategory"] }) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeading>Avg. months to pan</CardHeading>
      <ul className="flex flex-col gap-3">
        {data.map((item) => (
          <li key={item.category} className="flex items-center gap-3 min-h-[44px]">
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
              aria-hidden="true"
            />
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <span className="flex-shrink-0 text-sm font-bold">
              {item.avgMonths.toFixed(1)}
              <span className="text-xs text-muted-foreground font-normal ml-0.5">mo</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function StatsClient({ stats }: { stats: StatsData }) {
  if (!stats.hasData) return <EmptyState />

  return (
    <div className="pb-4">
      <StreakCard
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
      />
      <TotalEmptiesCard total={stats.totalEmpties} />
      <MonthlyTrendChart data={stats.monthlyTrend} />
      <CategoryBreakdownChart data={stats.categoryBreakdown} />
      <TopBrandsCard brands={stats.topBrands} />
      <AvgTimeToPanCard data={stats.avgTimeByCategory} />
    </div>
  )
}
