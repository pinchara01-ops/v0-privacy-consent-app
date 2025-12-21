import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { exportConsents } from "@/lib/consent-service"
import type { APIResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json<APIResponse>({ success: false, error: "API key required" }, { status: 401 })
    }

    const org = await validateApiKey(apiKey)
    if (!org) {
      return NextResponse.json<APIResponse>({ success: false, error: "Invalid API key" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userIdentifier = searchParams.get("user_identifier")

    if (!userIdentifier) {
      return NextResponse.json<APIResponse>({ success: false, error: "user_identifier is required" }, { status: 400 })
    }

    const exportData = await exportConsents(org.id, userIdentifier)

    return NextResponse.json<APIResponse>({ success: true, data: exportData }, { status: 200 })
  } catch (error) {
    console.error("[v0] Export consent API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
