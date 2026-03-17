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
import {
  Star,
  RotateCcw,
  Flame,
  PackageOpen,
  LayoutGrid,
  CalendarRange,
  Clock,
  Award
} from "lucide-react"
import type { StatsData } from "@/lib/services/stats"
import type { ProductCategory } from "@/lib/types/app"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  makeup: "#f472b6",    // pink-400
  skincare: "#34d399",  // emerald-400
  haircare: "#a78bfa",  // violet-400
  bodycare: "#fb923c",  // orange-400
  fragrance: "#38bdf8", // sky-400
  tools: "#94a3b8",     // slate-400
  other: "#d1d5db",     // gray-300
}

const TREND_COLOR = "#8b5cf6" // violet-500

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
    <div className={`bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-gray-100 p-6 ${className}`}>
      {children}
    </div>
  )
}

function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center text-sm font-semibold text-gray-500 mb-4 tracking-tight">
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 pt-16 pb-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="text-6xl mb-6">✨</div>
      <p className="text-xl font-bold tracking-tight mb-2 text-gray-900">No stats yet</p>
      <p className="text-base text-muted-foreground max-w-sm">
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
  return (
    <Card className="flex flex-col justify-between">
      <CardHeading><Flame className="w-4 h-4 mr-1.5 text-orange-500" />Pan Streak</CardHeading>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-orange-400 to-red-500 bg-clip-text text-transparent">
              {currentStreak}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              mo{currentStreak === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Current</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight text-gray-700">{longestStreak}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Best Ever</p>
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
    <Card className="flex flex-col justify-between">
      <CardHeading><PackageOpen className="w-4 h-4 mr-1.5 text-emerald-500" />Total Empties</CardHeading>
      <div>
        <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          {total}
        </span>
        <p className="text-xs text-muted-foreground mt-2 font-medium uppercase tracking-wider">
          Products finished all-time
        </p>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Monthly trend chart
// ---------------------------------------------------------------------------

function MonthlyTrendChart({ data }: { data: StatsData["monthlyTrend"] }) {
  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeading><CalendarRange className="w-4 h-4 mr-1.5 text-violet-500" />Monthly Empties</CardHeading>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              dy={10}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: 13,
                fontWeight: 500,
                padding: "8px 12px"
              }}
              formatter={(value) => [value ?? 0, "empties"]}
              labelStyle={{ fontWeight: 700, color: "#1f2937", marginBottom: "4px" }}
            />
            <Bar dataKey="count" fill="url(#colorTrend)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity={1} />
              </linearGradient>
            </defs>
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

  const chartHeight = Math.max(200, data.length * 48)

  return (
    <Card className="md:col-span-1 lg:col-span-1">
      <CardHeading><LayoutGrid className="w-4 h-4 mr-1.5 text-pink-500" />By Category</CardHeading>
      <div className="w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              hide
            />
            <YAxis
              type="category"
              dataKey="label"
              width={80}
              tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: 13,
                fontWeight: 500,
              }}
              formatter={(value) => [value ?? 0, "empties"]}
              labelStyle={{ fontWeight: 700, color: "#1f2937", display: "none" }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
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
    <Card className="flex flex-col">
      <CardHeading><Award className="w-4 h-4 mr-1.5 text-rose-500" />Most Panned Brands</CardHeading>
      <ol className="flex flex-col gap-3 flex-1">
        {brands.map((item, idx) => (
          <li key={item.brand} className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
            <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-rose-600">
                {idx + 1}
              </span>
            </div>
            <span className="flex-1 text-sm font-semibold truncate text-gray-700">{item.brand}</span>
            <span className="flex-shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-100">
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
    <Card className="flex flex-col">
      <CardHeading><Clock className="w-4 h-4 mr-1.5 text-sky-500" />Avg. Time to Pan</CardHeading>
      <ul className="flex flex-col gap-3 flex-1">
        {data.map((item) => (
          <li key={item.category} className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
            <div
              className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center bg-white shadow-sm border border-gray-100"
              aria-hidden="true"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
              />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-700">{item.label}</span>
            <span className="flex-shrink-0 text-sm font-bold text-gray-900">
              {item.avgMonths.toFixed(1)}
              <span className="text-xs text-muted-foreground font-medium ml-1">mo</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// New metrics
// ---------------------------------------------------------------------------

function RepurchaseRateCard({ rate }: { rate: number | null }) {
  if (rate === null) return null
  return (
    <Card className="flex flex-col justify-between">
      <CardHeading><RotateCcw className="w-4 h-4 mr-1.5 text-blue-500" />Repurchase Rate</CardHeading>
      <div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-black tracking-tighter bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">
            {rate}%
          </span>
          <span className="text-sm font-medium text-muted-foreground mb-1.5">
            would buy again
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${rate}%` }} />
        </div>
      </div>
    </Card>
  )
}

function TopRatedProductsCard({ products }: { products: StatsData["topRatedProducts"] }) {
  if (products.length === 0) return null
  return (
    <Card className="flex flex-col md:col-span-2 lg:col-span-2">
      <CardHeading><Star className="w-4 h-4 mr-1.5 text-amber-500" />Highest Rated</CardHeading>
      <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 content-start">
        {products.map((item, idx) => (
          <li key={`${item.brand}-${item.name}`} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
            <span className="text-sm font-black text-gray-300 w-4 text-center flex-shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
              <p className="text-xs font-medium text-muted-foreground truncate">{item.brand}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              <span className="text-sm font-bold text-amber-600">{item.rating.toFixed(1)}</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function StatsClient({ stats }: { stats: StatsData }) {
  if (!stats.hasData) return <EmptyState />

  return (
    <div className="px-4 pb-12 pt-2 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StreakCard
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />
        <TotalEmptiesCard total={stats.totalEmpties} />
        <RepurchaseRateCard rate={stats.repurchaseRate} />
        
        <MonthlyTrendChart data={stats.monthlyTrend} />
        
        <TopRatedProductsCard products={stats.topRatedProducts} />
        <CategoryBreakdownChart data={stats.categoryBreakdown} />
        
        <TopBrandsCard brands={stats.topBrands} />
        <AvgTimeToPanCard data={stats.avgTimeByCategory} />
      </div>
    </div>
  )
}
