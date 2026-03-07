import { NextResponse } from "next/server"

export async function GET() {
  // DB ping added in Phase 2 when Prisma is wired up
  return NextResponse.json({ status: "ok", db: "pending" })
}
