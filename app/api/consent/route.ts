import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { createOrUpdateConsent, getConsents, batchUpdateConsents } from "@/lib/consent-service"
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
    const { user_identifier, consent_type, status, metadata, consents } = body

    if (!user_identifier) {
      return NextResponse.json<APIResponse>({ success: false, error: "user_identifier is required" }, { status: 400 })
    }

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    let result

    if (consents && Array.isArray(consents)) {
      // Batch update
      result = await batchUpdateConsents(
        org.id,
        user_identifier,
        consents,
        metadata || {},
        ipAddress || undefined,
        userAgent || undefined,
      )
    } else if (consent_type && status) {
      // Single consent
      result = await createOrUpdateConsent(
        org.id,
        user_identifier,
        consent_type,
        status,
        metadata || {},
        ipAddress || undefined,
        userAgent || undefined,
      )
    } else {
      return NextResponse.json<APIResponse>({ success: false, error: "Invalid request format" }, { status: 400 })
    }

    return NextResponse.json<APIResponse>({ success: true, data: result }, { status: 200 })
  } catch (error) {
    console.error("[v0] Consent API error:", error)
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
    const userIdentifier = searchParams.get("user_identifier")

    if (!userIdentifier) {
      return NextResponse.json<APIResponse>({ success: false, error: "user_identifier is required" }, { status: 400 })
    }

    const consents = await getConsents(org.id, userIdentifier)

    return NextResponse.json<APIResponse>({ success: true, data: consents }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get consent API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
