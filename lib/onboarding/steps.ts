export interface TutorialStep {
  id: string
  emoji: string
  title: string
  body: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    emoji: "✨",
    title: "Welcome to PanTracker",
    body: "Track every product you're working through. The goal: finish what you have before buying more.",
  },
  {
    id: "pan",
    emoji: "🗂️",
    title: "Your Active Pan",
    body: "The Pan tab shows everything you're currently using. Tap any card to log your progress or add notes.",
  },
  {
    id: "picks",
    emoji: "⭐",
    title: "Monthly Picks",
    body: "Star up to 3 products as your focus picks for this month. Unfinished picks carry over automatically.",
  },
  {
    id: "add",
    emoji: "➕",
    title: "Add Products",
    body: "Tap the + button on the Pan screen to add a product from your library or create a brand-new one.",
  },
  {
    id: "empty",
    emoji: "🎉",
    title: "Log an Empty",
    body: "Finished a product? Tap it and choose 'Log Empty'. Leave a rating — your history builds over time.",
  },
  {
    id: "library",
    emoji: "📦",
    title: "Products & Empties",
    body: "Products tab = your full library. Empties = everything you've finished. Find Wishlist and Import in the menu.",
  },
]
