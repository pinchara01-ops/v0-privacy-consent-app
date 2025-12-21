import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { recordBotEvent } from "@/lib/bot-detection-service"
import type { APIResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json<APIResponse>({ success: false, error: "API key required" }, { status: 401 })
    }

    const org = await validateApiKey(apiKey)
    if (!org) {
      return NextResponse.json<APIResponse>({ success: false, error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { session_id, event_type, event_data } = body

    if (!session_id || !event_type) {
      return NextResponse.json<APIResponse>(
        { success: false, error: "session_id and event_type are required" },
        { status: 400 },
      )
    }

    const event = await recordBotEvent(session_id, event_type, event_data || {})

    return NextResponse.json<APIResponse>({ success: true, data: event }, { status: 200 })
  } catch (error) {
    console.error("[v0] Bot event API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
