import { NextResponse } from "next/server"

export async function PATCH() {
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 })
}
