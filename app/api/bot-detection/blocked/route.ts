import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { logBotBlockedEvent, getSummaryStatistics } from "@/lib/botd-service"
import type { APIResponse } from "@/lib/types"
import { withCors, handleOptions } from "@/lib/cors"

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(request: NextRequest) {
    console.log("📥 RECEIVED BLOCK EVENT AT API");
    try {
        const apiKey = request.headers.get("x-api-key")
        console.log("🔑 API Key provided:", apiKey ? "Yes" : "No");

        if (!apiKey) {
            return withCors(NextResponse.json<APIResponse>(
                { success: false, error: "API key required" },
                { status: 401 }
            ))
        }

        const org = await validateApiKey(apiKey)
        if (!org) {
            return withCors(NextResponse.json<APIResponse>(
                { success: false, error: "Invalid API key" },
                { status: 401 }
            ))
        }

        const body = await request.json()
        const { bot_kind, url, timestamp, blocked, detection_source } = body

        if (!bot_kind || !url) {
            return withCors(NextResponse.json<APIResponse>(
                { success: false, error: "bot_kind and url are required" },
                { status: 400 }
            ))
        }

        const ipAddress = request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            undefined

        const blockedEvent = await logBotBlockedEvent({
            organization_id: org.id,
            bot_kind,
            detection_source: detection_source || 'botd_library',
            url,
            ip_address: ipAddress,
            user_agent: request.headers.get("user-agent") || undefined,
            block_reason: `Automated bot detected (Score: ${body.metadata?.bot_score || 'N/A'})`,
            metadata: {
                timestamp: timestamp || new Date().toISOString(),
                blocked: blocked !== false,
                ...(body.metadata || {})
            }
        })

        return withCors(NextResponse.json<APIResponse>(
            {
                success: true,
                data: {
                    id: blockedEvent.id,
                    logged: true,
                    bot_kind,
                    blocked: true,
                    timestamp: blockedEvent.created_at
                }
            },
            { status: 200 }
        ))
    } catch (error) {
        console.error("[v0] Bot blocked API error:", error)
        return withCors(NextResponse.json<APIResponse>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        ))
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const apiKey = request.headers.get("x-api-key") || searchParams.get("api_key");

        if (!apiKey) {
            return withCors(NextResponse.json<APIResponse>(
                { success: false, error: "API key required" },
                { status: 401 }
            ))
        }

        const org = await validateApiKey(apiKey)
        if (!org) {
            return withCors(NextResponse.json<APIResponse>(
                { success: false, error: "Invalid API key" },
                { status: 401 }
            ))
        }

        const stats = await getSummaryStatistics(org.id)

        return withCors(NextResponse.json<APIResponse>(
            {
                success: true,
                data: stats
            },
            { status: 200 }
        ))
    } catch (error) {
        console.error("[v0] Bot blocked stats API error:", error)
        return withCors(NextResponse.json<APIResponse>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        ))
    }
}
