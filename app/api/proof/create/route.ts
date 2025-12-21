import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { createConsentProof } from "@/lib/proof-service"
import { sql } from "@/lib/db"
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
    const { consent_id } = body

    if (!consent_id) {
      return NextResponse.json<APIResponse>({ success: false, error: "consent_id is required" }, { status: 400 })
    }

    // Get consent record
    const consentResult = await sql`
      SELECT * FROM consent_records WHERE id = ${consent_id} AND organization_id = ${org.id} LIMIT 1
    `

    if (consentResult.length === 0) {
      return NextResponse.json<APIResponse>({ success: false, error: "Consent not found" }, { status: 404 })
    }

    const consent = consentResult[0]

    const proofData = {
      consent_id: consent.id,
      user_identifier: consent.user_identifier,
      consent_type: consent.consent_type,
      status: consent.status,
      timestamp: consent.created_at,
      ip_address: consent.ip_address,
      user_agent: consent.user_agent,
      metadata: consent.metadata,
    }

    const proof = await createConsentProof(org.id, consent_id, proofData)

    return NextResponse.json<APIResponse>({ success: true, data: proof }, { status: 200 })
  } catch (error) {
    console.error("[v0] Create proof API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
