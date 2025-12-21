import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { batchVerifyProofs } from "@/lib/proof-service"
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
    const { proof_hashes } = body

    if (!proof_hashes || !Array.isArray(proof_hashes)) {
      return NextResponse.json<APIResponse>(
        { success: false, error: "proof_hashes array is required" },
        { status: 400 },
      )
    }

    const results = await batchVerifyProofs(proof_hashes)

    return NextResponse.json<APIResponse>({ success: true, data: results }, { status: 200 })
  } catch (error) {
    console.error("[v0] Batch verify API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
