import { type NextRequest, NextResponse } from "next/server"
import { verifyConsentProof, getProofByHash } from "@/lib/proof-service"
import type { APIResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proofHash = searchParams.get("proof_hash")

    if (!proofHash) {
      return NextResponse.json<APIResponse>({ success: false, error: "proof_hash is required" }, { status: 400 })
    }

    const isValid = await verifyConsentProof(proofHash)
    const proof = await getProofByHash(proofHash)

    if (!proof) {
      return NextResponse.json<APIResponse>({ success: false, error: "Proof not found" }, { status: 404 })
    }

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          verified: isValid,
          proof,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Verify proof API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
