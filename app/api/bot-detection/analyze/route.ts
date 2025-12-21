import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { analyzeBotSession } from "@/lib/bot-detection-service"
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
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json<APIResponse>({ success: false, error: "session_id is required" }, { status: 400 })
    }

    const analysis = await analyzeBotSession(org.id, session_id)

    return NextResponse.json<APIResponse>({ success: true, data: analysis }, { status: 200 })
  } catch (error) {
    console.error("[v0] Bot analysis API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
