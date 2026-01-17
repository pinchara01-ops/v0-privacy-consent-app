import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getRecentBlockedEvents } from "@/lib/botd-service";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
    return handleOptions();
}

/**
 * GET /api/admin/bot-audit
 * 
 * RESEARCH ENDPOINT: Returns raw behavioral forensics for model training.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const apiKey = request.headers.get("x-api-key") || searchParams.get("api_key");

        if (!apiKey) return withCors(NextResponse.json({ success: false, error: "API key required" }, { status: 401 }));

        const org = await validateApiKey(apiKey);
        if (!org) return withCors(NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401 }));

        console.log(`🔍 AUDITING ORG: ${org.name} (${org.id})`);
        const events = await getRecentBlockedEvents(org.id, 10);

        return withCors(NextResponse.json({
            success: true,
            project: "PrivacyD Forensic Analysis",
            data_points: events.map(e => ({
                event_id: e.id,
                timestamp: e.blocked_at,
                detection_type: e.bot_kind,
                url: e.url,
                // THE RAW DATA FOR YOUR MODEL:
                raw_forensics: {
                    botd_probability_score: e.metadata?.bot_score || 0.0,
                    mouse_trace: e.metadata?.mouse_trace || [], // Full [x,y,t] array
                    network_timestamps: e.metadata?.network_timestamps || [], // Full timestamp list
                    agent_fingerprint: e.user_agent
                }
            }))
        }));
    } catch (error) {
        return withCors(NextResponse.json({ success: false, error: "Audit Database Error" }, { status: 500 }));
    }
}
