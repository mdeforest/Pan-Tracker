/**
 * Curated list of known beauty brands for auto-splitting Sophia-format CSV rows.
 * Sorted longest-first so "Anastasia Beverly Hills" matches before a shorter prefix.
 * Add new brands here as needed — no other files need to change.
 */
const KNOWN_BRANDS = [
  "Anastasia Beverly Hills",
  "Charlotte Tilbury",
  "Charolette Tilbury",
  "Decorte",
  "Dermalogica",
  "Drunk Elephant",
  "Estée Lauder",
  "Estee Lauder",
  "Experiment Beauty",
  "First Aid Beauty",
  "Glow Recipe",
  "Good Molecules",
  "KraveBeauty",
  "Mixsoon",
  "Naturium",
  "Peach & Lily",
  "Round Lab",
  "Shiseido",
  "Sisley Paris",
  "Sisley",
  "SkinMedica",
  "Sungboon Editor",
  "Sulwhasoo",
  "Skinfix",
  "Bubble",
  "Caudalie",
  "Cocokind",
  "Farmacy",
  "Fenty Beauty",
  "Hanskin",
  "Ilia",
  "Lancome",
  "L'Oreal",
  "Maybelline",
  "No7",
  "SK-II",
  "Tarte",
  "Tatcha",
  "Too Faced",
  "U Beauty",
  "Wyn Beauty",
  "De de peau",
  "Provence Beauty",
  "50 Mild",
  "Callie Rae",
]

/** Brands sorted longest-first to prevent shorter prefixes shadowing longer matches */
export const KNOWN_BRANDS_SORTED: string[] = [...KNOWN_BRANDS].sort(
  (a, b) => b.length - a.length
)
