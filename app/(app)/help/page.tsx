import type React from "react"
import {
  Sparkles,
  Star,
  FlaskConical,
  Package,
  BarChart2,
  Heart,
  Upload,
} from "lucide-react"

export const metadata = {
  title: "Help — PanTracker",
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-6 space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
        <h2 className="font-bold text-lg tracking-tight">{title}</h2>
      </div>
      <div className="space-y-2 text-sm text-foreground leading-relaxed">
        {children}
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="space-y-1 pt-2 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          How to use PanTracker
        </h1>
        <p className="text-muted-foreground text-sm">
          A quick reference for everything in the app.
        </p>
      </div>

      <Section icon={Sparkles} title="Your Pan">
        <p>
          The Pan is your active list of products you&apos;re working through
          this month.
        </p>
        <p>
          Tap the <strong>+</strong> button (bottom right) to add a product from
          your library, or create a new one on the spot.
        </p>
        <p>
          Each product card has a usage slider — set it to Low, Medium, or High
          to track how quickly you&apos;re getting through it.
        </p>
        <p>
          Tap the <strong>month label</strong> at the top to jump to a different
          month. Products carry over automatically from previous months unless
          you remove them.
        </p>
      </Section>

      <Section icon={Star} title="Monthly Picks">
        <p>
          Picks are your focus products for the month — the ones you&apos;re
          prioritising.
        </p>
        <p>
          Open a product&apos;s detail sheet (tap the card) and tap the{" "}
          <strong>star icon</strong> in the top corner to mark it as a monthly
          pick.
        </p>
        <p>
          Picks appear with a star badge and are visually highlighted in the pan
          view.
        </p>
      </Section>

      <Section icon={FlaskConical} title="Logging an Empty">
        <p>When you finish a product, open its detail sheet and tap <strong>Mark Empty</strong>.</p>
        <p>
          You&apos;ll be prompted to leave a quick review: a star rating,
          whether you&apos;d repurchase, and optional notes.
        </p>
        <p>
          Once logged, the product moves out of your active pan and into your
          Empties log.
        </p>
      </Section>

      <Section icon={Package} title="Products Library">
        <p>
          The Products tab is your full library of every product you&apos;ve
          added to the app.
        </p>
        <p>
          Tap the <strong>+</strong> button to add a new product. You can set
          the brand, name, category, and upload a photo.
        </p>
        <p>
          Tap any product to view its full history — past pan entries and
          empties with reviews.
        </p>
        <p>
          Tap <strong>Edit</strong> from the detail sheet to update the name,
          brand, category, or photo.
        </p>
      </Section>

      <Section icon={FlaskConical} title="Empties Log">
        <p>The Empties tab shows everything you&apos;ve finished, with your review for each.</p>
        <p>
          Filter by month/year using the selector at the top, or filter by
          category using the chips below it.
        </p>
        <p>Tap an empty card to expand it and read your full review notes.</p>
      </Section>

      <Section icon={BarChart2} title="Stats">
        <p>
          The Stats tab gives you a summary of your panning progress over time.
        </p>
        <p>
          See how many products you&apos;ve emptied, your category breakdown,
          repurchase rate, and average time to pan by category.
        </p>
      </Section>

      <Section icon={Heart} title="Wishlist">
        <p>
          The Wishlist lives in the user menu (tap your avatar). Use it to track
          products you want to buy next.
        </p>
        <p>
          Add items as free-text (brand + name) or link them to an existing
          product in your library.
        </p>
        <p>
          Mark items as <strong>Purchased</strong> once you&apos;ve bought them
          — they&apos;ll stay in your history for reference.
        </p>
        <p>
          The wishlist total gives you a running estimate of what you&apos;d
          spend if you bought everything on it.
        </p>
      </Section>

      <Section icon={Upload} title="Importing history">
        <p>
          Import History is also in the user menu. Use it to bulk-import past
          pan history from a CSV file.
        </p>
        <p>
          The CSV supports three statuses: <code>current_pan</code> (adds to
          active pan), <code>empty</code> (logs an empty), and{" "}
          <code>backlog</code> (adds to product library only).
        </p>
        <p>
          After uploading, you&apos;ll see a preview of what will be imported
          before anything is saved. Review it carefully — imports can&apos;t be
          undone from the UI.
        </p>
      </Section>
    </div>
  )
}
