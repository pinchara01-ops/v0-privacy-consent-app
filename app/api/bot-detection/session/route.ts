import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { createBotSession, getBotSession } from "@/lib/bot-detection-service"
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
    const { session_id, user_identifier } = body

    if (!session_id) {
      return NextResponse.json<APIResponse>({ success: false, error: "session_id is required" }, { status: 400 })
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    const session = await createBotSession(
      org.id,
      session_id,
      user_identifier,
      ipAddress || undefined,
      userAgent || undefined,
    )

    return NextResponse.json<APIResponse>({ success: true, data: session }, { status: 200 })
  } catch (error) {
    console.error("[v0] Bot session API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

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
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json<APIResponse>({ success: false, error: "session_id is required" }, { status: 400 })
    }

    const session = await getBotSession(sessionId)

    if (!session) {
      return NextResponse.json<APIResponse>({ success: false, error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json<APIResponse>({ success: true, data: session }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get bot session API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
