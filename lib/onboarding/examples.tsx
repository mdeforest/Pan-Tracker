/**
 * One visual example per tutorial step, indexed to match TUTORIAL_STEPS.
 * These are purely decorative mini-mockups rendered inside the card.
 */

export const TUTORIAL_EXAMPLES: React.ReactNode[] = [
  // 0 — Welcome
  <div key="welcome" className="flex justify-center gap-2 w-full">
    {(["💄", "🧴", "🌸", "💆"] as const).map((emoji, i) => (
      <div key={i} className="flex flex-col items-center gap-1.5 flex-1 rounded-xl bg-muted p-2">
        <span className="text-2xl">{emoji}</span>
        <div className="w-full h-1.5 rounded-full bg-muted-foreground/20">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${[70, 30, 55, 90][i]}%` }}
          />
        </div>
      </div>
    ))}
  </div>,

  // 1 — Your Active Pan
  <div key="active-pan" className="grid grid-cols-2 gap-2 w-full">
    {[
      { emoji: "💄", name: "Rare Beauty Blush", pct: 75, pick: true },
      { emoji: "🧴", name: "CeraVe SPF 30", pct: 30, pick: false },
      { emoji: "🌸", name: "Jo Malone Peony", pct: 50, pick: false },
      { emoji: "💆", name: "Olaplex No. 3", pct: 90, pick: false },
    ].map(({ emoji, name, pct, pick }) => (
      <div key={name} className="relative flex flex-col rounded-xl bg-muted overflow-hidden">
        <div className="flex items-center justify-center aspect-square text-3xl bg-secondary">
          {emoji}
        </div>
        {pick && (
          <span className="absolute right-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
            Pick ★
          </span>
        )}
        <div className="p-2 space-y-1">
          <p className="text-[9px] font-bold uppercase leading-tight line-clamp-1">{name}</p>
          <div className="h-1 w-full rounded-full bg-muted-foreground/20">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    ))}
  </div>,

  // 2 — Logging Progress
  <div key="log-progress" className="flex flex-col gap-2 w-full">
    <div className="flex gap-1 w-full">
      {["Just\nStarted", "25%", "Half", "75%", "Almost\nDone"].map((label, i) => (
        <button
          key={i}
          className={`flex-1 rounded-lg py-2 px-1 text-[9px] font-semibold leading-tight text-center whitespace-pre-line pointer-events-none ${
            i === 1 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
      <span className="text-xs text-muted-foreground flex-1">Add a note...</span>
      <span className="text-[10px] font-semibold text-primary">Save</span>
    </div>
  </div>,

  // 3 — Monthly Picks
  <div key="monthly-picks" className="flex flex-col gap-2 w-full">
    {[
      { emoji: "💄", name: "Rare Beauty Blush", pick: true },
      { emoji: "🧴", name: "CeraVe Moisturizer", pick: true },
      { emoji: "🌸", name: "Jo Malone Peony", pick: false },
    ].map(({ emoji, name, pick }) => (
      <div key={name} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
        <span className="text-xl">{emoji}</span>
        <span className="flex-1 text-xs font-semibold">{name}</span>
        {pick ? (
          <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
            Pick ★
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/50">☆</span>
        )}
      </div>
    ))}
    <p className="text-[10px] text-muted-foreground text-center">2 of 3 picks used this month</p>
  </div>,

  // 4 — Logging an Empty
  <div key="log-empty" className="flex flex-col gap-3 w-full">
    <div className="flex flex-col items-center gap-1 rounded-xl bg-muted p-3">
      <p className="text-[10px] font-semibold text-muted-foreground">How did you like it?</p>
      <div className="flex gap-1 text-2xl">
        {"★★★★☆".split("").map((s, i) => (
          <span key={i} className={s === "★" ? "text-amber-400" : "text-muted-foreground/30"}>
            {s}
          </span>
        ))}
      </div>
    </div>
    <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
      <span className="text-xs font-medium">Would repurchase?</span>
      <div className="flex gap-1.5">
        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">
          Yes
        </span>
        <span className="rounded-full bg-muted-foreground/10 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          No
        </span>
      </div>
    </div>
  </div>,

  // 5 — Carry-Over
  <div key="carry-over" className="flex flex-col gap-2 w-full">
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-900">New month, same mission.</p>
      <p className="text-[10px] text-amber-700 mt-0.5">3 products carried over from February</p>
      <div className="mt-2 flex gap-1.5">
        {["💄", "🧴", "🌸"].map((e) => (
          <div key={e} className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-lg">
            {e}
          </div>
        ))}
        <div className="flex items-center ml-1 text-amber-600">
          <span className="text-xs font-semibold">→ March</span>
        </div>
      </div>
    </div>
  </div>,

  // 6 — Adding a Product
  <div key="add-product" className="flex flex-col gap-2 w-full">
    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
      <span className="text-sm">🔍</span>
      <span className="text-xs text-muted-foreground">Search &ldquo;Rose Blush&rdquo;...</span>
    </div>
    <div className="flex items-center gap-2 rounded-xl bg-white border border-border px-3 py-2 shadow-sm">
      <span className="text-xl">💄</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">Rare Beauty Soft Pinch Blush</p>
        <p className="text-[9px] text-muted-foreground">Makeup · Rare Beauty</p>
      </div>
      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
        + Add
      </span>
    </div>
    <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/20 px-3 py-2">
      <span className="text-sm">✏️</span>
      <span className="text-xs text-muted-foreground">Or create a new product...</span>
    </div>
  </div>,

  // 7 — Product Library
  <div key="product-library" className="flex flex-col gap-2 w-full">
    <div className="flex gap-1.5 overflow-hidden">
      {["All", "Makeup", "Skincare", "Haircare"].map((c, i) => (
        <span
          key={c}
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {c}
        </span>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-1.5">
      {["💄", "🧴", "🌸", "💆", "✨", "🪮"].map((e, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-muted flex items-center justify-center text-2xl"
        >
          {e}
        </div>
      ))}
    </div>
  </div>,

  // 8 — Empties Log
  <div key="empties-log" className="flex flex-col gap-1.5 w-full">
    {[
      { emoji: "💄", name: "Rare Beauty Blush", stars: 5, date: "Feb 2026" },
      { emoji: "🧴", name: "CeraVe Moisturizer", stars: 4, date: "Jan 2026" },
      { emoji: "🌸", name: "Jo Malone Peony", stars: 5, date: "Dec 2025" },
    ].map(({ emoji, name, stars, date }) => (
      <div key={name} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
        <span className="text-xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] text-amber-400">{"★".repeat(stars)}</span>
            <span className="text-[9px] text-muted-foreground">· {date}</span>
          </div>
        </div>
        <span className="text-[9px] font-semibold text-primary">Empty ✓</span>
      </div>
    ))}
  </div>,

  // 9 — Wishlist
  <div key="wishlist" className="flex flex-col gap-1.5 w-full">
    {[
      { emoji: "✨", name: "La Mer Crème", price: "$340", tag: "💛 Wanted" },
      { emoji: "💄", name: "Hourglass Blush", price: "$46", tag: "💛 Wanted" },
      { emoji: "🧴", name: "Tatcha Dewy Skin Cream", price: "$69", tag: "✓ Purchased" },
    ].map(({ emoji, name, price, tag }) => (
      <div key={name} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
        <span className="text-xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{name}</p>
          <p className="text-[9px] text-muted-foreground">{tag} · {price}</p>
        </div>
      </div>
    ))}
  </div>,

  // 10 — Import History
  <div key="import" className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 p-4 w-full">
    <span className="text-4xl">📄</span>
    <div className="text-center">
      <p className="text-xs font-semibold">my-pan-history.csv</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">supports products, empties & backlog</p>
    </div>
    <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
      132 products imported ✓
    </div>
  </div>,

  // 11 — All Set
  <div key="all-set" className="flex flex-col items-center gap-3 w-full">
    <div className="flex gap-2 text-3xl">
      {["💄", "🧴", "🌸", "💆", "✨"].map((e) => (
        <span key={e}>{e}</span>
      ))}
    </div>
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-primary w-full animate-pulse" />
    </div>
    <p className="text-xs font-semibold text-muted-foreground">Your first pan starts now.</p>
  </div>,
]
