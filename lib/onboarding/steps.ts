export interface TutorialStep {
  id: string
  emoji: string
  title: string
  body: string
  targetId?: string
  renderExample?: boolean
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    emoji: "✨",
    title: "Welcome to PanTracker",
    body: "\"Project pan\" is a beauty challenge: use up the products you already own before buying new ones. PanTracker helps you stay on top of what you're working through, celebrate your empties, and resist impulse buys.",
  },
  {
    id: "pan",
    emoji: "🗂️",
    title: "Your Active Pan",
    body: "The Pan tab is your home screen. Every product you're currently using lives here as a card. The progress bar on each card shows how much is left. Tap any card to open it and see more options.",
    targetId: "nav-pan",
    renderExample: true,
  },
  {
    id: "logging-progress",
    emoji: "📈",
    title: "Logging Your Progress",
    body: "Inside a product, use the usage slider to update how much you've used — from Just Started all the way to Almost Done. You can also leave a note about how it's going. Hit Save when you're done.",
    renderExample: true,
  },
  {
    id: "monthly-picks",
    emoji: "⭐",
    title: "Monthly Picks",
    body: "At the start of each month, choose up to 3 products as your focus picks — the ones you want to prioritize finishing. Open a product and tap the star icon to mark it as a pick. Picks show a star badge on their card so they stand out.",
    renderExample: true,
  },
  {
    id: "logging-empty",
    emoji: "🎉",
    title: "Logging an Empty",
    body: "When you finish a product, open its card and tap \"Log Empty.\" You'll be asked to rate it out of 5, say whether you'd repurchase it, and leave an optional review. This moves it out of your pan and into your Empties log.",
    renderExample: true,
  },
  {
    id: "carry-over",
    emoji: "🗓️",
    title: "Carry-Over",
    body: "When you navigate to a new month, any products still in your pan automatically carry over. Your usage progress and notes carry with them — you never have to re-add something you're still working on.",
  },
  {
    id: "add-product",
    emoji: "➕",
    title: "Adding a Product to Your Pan",
    body: "Tap the + button on the Pan screen. Search for an existing product in your library, or tap \"Create New\" to add something fresh. You can set the category, brand, name, and upload a photo. It lands straight in your active pan.",
  },
  {
    id: "library",
    emoji: "📦",
    title: "Your Product Library",
    body: "The Products tab holds every product you've ever added, even ones not currently in your pan. Use the search bar or category chips to find things. Tap a product to edit its details or add it to your current pan.",
    targetId: "nav-products",
  },
  {
    id: "empties-log",
    emoji: "🧪",
    title: "The Empties Log",
    body: "The Empties tab shows everything you've finished, in reverse order. Filter by month or category to browse your history. Tap an empty to see your full review — star rating, repurchase decision, and notes.",
    targetId: "nav-empties",
  },
  {
    id: "wishlist",
    emoji: "🎁",
    title: "Your Wishlist",
    body: "When you finish something and want to buy a replacement, or you spot something new you want, add it to your Wishlist instead of buying it right away. Open the menu (your avatar) and tap Wishlist. You can link wishlist items to products in your library and track an estimated cost.",
  },
  {
    id: "import-history",
    emoji: "📤",
    title: "Import History",
    body: "If you've been tracking your pan elsewhere, you don't have to start from scratch. Go to the menu and tap Import History to upload a CSV file with your past products, empties, and usage history.",
  },
  {
    id: "done",
    emoji: "🚀",
    title: "You're all set",
    body: "Your pan is ready. Come back whenever you use a product to log your progress, and don't forget to celebrate every empty. The goal isn't perfection — it's making progress through what you have.",
  },
]
