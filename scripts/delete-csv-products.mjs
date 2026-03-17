#!/usr/bin/env node
/**
 * Testing utility: deletes all products (and their related pan_entries, empties,
 * monthly_picks) that appear in a CSV file, for a given user.
 *
 * Usage:
 *   node --env-file=.env.local scripts/delete-csv-products.mjs --email user@example.com
 *   node --env-file=.env.local scripts/delete-csv-products.mjs --email user@example.com --csv docs/test-import.csv
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env.
 * Deletes cascade to pan_entries → monthly_picks / empties automatically.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// --- Args -------------------------------------------------------------------

const args = process.argv.slice(2)

function getFlag(name) {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] : undefined
}

const csvPath = getFlag("--csv") ?? "docs/test-import.csv"
const email = getFlag("--email") ?? process.env.USER_EMAIL

if (!email) {
  console.error("Error: provide --email <email> or set USER_EMAIL env var")
  process.exit(1)
}

// --- Supabase admin client --------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// --- Look up user -----------------------------------------------------------

const {
  data: { users },
  error: usersError,
} = await supabase.auth.admin.listUsers()

if (usersError) {
  console.error("Error fetching users:", usersError.message)
  process.exit(1)
}

const user = users.find((u) => u.email === email)
if (!user) {
  console.error(`No user found with email: ${email}`)
  process.exit(1)
}

console.log(`User: ${email} (${user.id})`)

// --- Parse CSV --------------------------------------------------------------

const csvText = readFileSync(resolve(csvPath), "utf-8")

/** Minimal RFC-4180 CSV row parser — handles quoted cells with embedded commas/quotes. */
function parseRow(line) {
  const cells = []
  let cell = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        cell += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      cells.push(cell.trim())
      cell = ""
    } else {
      cell += c
    }
  }

  cells.push(cell.trim())
  return cells
}

const lines = csvText
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)

if (lines.length < 2) {
  console.error("CSV has no data rows")
  process.exit(1)
}

const headers = parseRow(lines[0]).map((h) => h.toLowerCase())
const brandIdx = headers.indexOf("brand")
const nameIdx = headers.indexOf("name")

if (brandIdx < 0 || nameIdx < 0) {
  console.error("CSV is missing required 'brand' or 'name' columns")
  process.exit(1)
}

const products = lines
  .slice(1)
  .map((line) => {
    const cells = parseRow(line)
    return { brand: cells[brandIdx] ?? "", name: cells[nameIdx] ?? "" }
  })
  .filter((p) => p.brand && p.name)

console.log(`Products in CSV: ${products.length}`)
console.log("---")

// --- Delete -----------------------------------------------------------------

let deleted = 0
let notFound = 0
let errored = 0

for (const { brand, name } of products) {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("user_id", user.id)
    .eq("brand", brand)
    .eq("name", name)
    .select("id")

  if (error) {
    console.error(`  ✗  ${brand} — ${name}  →  ${error.message}`)
    errored++
  } else if (!data || data.length === 0) {
    console.log(`  ~  ${brand} — ${name}  →  not found`)
    notFound++
  } else {
    console.log(`  ✓  ${brand} — ${name}  →  deleted (${data.length})`)
    deleted++
  }
}

console.log("---")
console.log(`Done: ${deleted} deleted, ${notFound} not found, ${errored} errors`)

if (errored > 0) process.exit(1)
