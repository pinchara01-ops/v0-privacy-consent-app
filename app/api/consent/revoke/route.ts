import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { revokeConsent } from "@/lib/consent-service"
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
    const { user_identifier, consent_type } = body

    if (!user_identifier || !consent_type) {
      return NextResponse.json<APIResponse>(
        { success: false, error: "user_identifier and consent_type are required" },
        { status: 400 },
      )
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")

    const result = await revokeConsent(org.id, user_identifier, consent_type, ipAddress || undefined)

    return NextResponse.json<APIResponse>({ success: true, data: result }, { status: 200 })
  } catch (error) {
    console.error("[v0] Revoke consent API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
