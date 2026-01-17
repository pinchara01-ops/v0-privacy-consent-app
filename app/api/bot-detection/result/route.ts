import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"
import { logBotDetectionResult } from "@/lib/botd-service"
import type { APIResponse } from "@/lib/types"
import { withCors, handleOptions } from "@/lib/cors"

export async function OPTIONS() {
    return handleOptions()
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get("x-api-key")

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
        const { bot_detected, bot_kind, url, timestamp, user_agent, botd_result } = body

        if (typeof bot_detected !== 'boolean') {
            return withCors(NextResponse.json<APIResponse>(
                { success: false, error: "bot_detected (boolean) is required" },
                { status: 400 }
            ))
        }

        const ipAddress = request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            undefined

        const referrer = request.headers.get("referer") || undefined

        let detectionSource: 'botd_library' | 'fallback' | 'whitelist' = 'botd_library'
        if (botd_result?.fallback) {
            detectionSource = 'fallback'
        } else if (botd_result?.whitelisted) {
            detectionSource = 'whitelist'
        }

        const detectionResult = await logBotDetectionResult({
            organization_id: org.id,
            bot_detected,
            bot_kind: bot_kind || (bot_detected ? "Unknown" : "Human"),
            detection_source: detectionSource,
            url: url || "unknown",
            ip_address: ipAddress,
            user_agent: user_agent || request.headers.get("user-agent") || null,
            referrer,
            botd_request_time: botd_result?.requestTime,
            botd_components: botd_result?.components,
            metadata: {
                timestamp: timestamp || new Date().toISOString(),
                raw_result: botd_result
            }
        })

        return withCors(NextResponse.json<APIResponse>(
            {
                success: true,
                data: {
                    id: detectionResult.id,
                    logged: true,
                    bot_detected,
                    timestamp: detectionResult.created_at
                }
            },
            { status: 200 }
        ))
    } catch (error) {
        console.error("[v0] Bot detection result API error:", error)
        return withCors(NextResponse.json<APIResponse>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        ))
    }
}
