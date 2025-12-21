import { type NextRequest, NextResponse } from "next/server"
import { generateProofCertificate } from "@/lib/proof-service"
import type { APIResponse } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proofHash = searchParams.get("proof_hash")

    if (!proofHash) {
      return NextResponse.json<APIResponse>({ success: false, error: "proof_hash is required" }, { status: 400 })
    }

    const certificate = await generateProofCertificate(proofHash)

    return NextResponse.json<APIResponse>({ success: true, data: certificate }, { status: 200 })
  } catch (error) {
    console.error("[v0] Certificate API error:", error)
    return NextResponse.json<APIResponse>({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
