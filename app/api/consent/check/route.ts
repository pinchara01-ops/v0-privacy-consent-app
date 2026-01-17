import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { withCors, handleOptions } from "@/lib/cors"

export async function OPTIONS() {
    return handleOptions()
}

/**
 * GET /api/consent/check?post_ids=post1,post2,post3
 * 
 * Checks the AI/Bot status for specific posts
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const postIdsParam = searchParams.get("post_ids")

        if (!postIdsParam) {
            return withCors(NextResponse.json({ success: true, consents: {} }))
        }

        const postIds = postIdsParam.split(",")

        // Query the most recent consent status for each post_id
        const records = await sql`
            SELECT DISTINCT ON (metadata->>'post_id')
                metadata->>'post_id' as post_id,
                status
            FROM consent_records
            WHERE metadata->>'post_id' = ANY(${postIds})
            ORDER BY metadata->>'post_id', created_at DESC
        `

        const consents: Record<string, boolean> = {}
        records.forEach(row => {
            consents[row.post_id] = row.status === 'granted'
        })

        return withCors(NextResponse.json({
            success: true,
            consents
        }))
    } catch (error) {
        console.error("Consent check error:", error)
        return withCors(NextResponse.json({ success: false, error: "Internal error" }, { status: 500 }))
    }
}
