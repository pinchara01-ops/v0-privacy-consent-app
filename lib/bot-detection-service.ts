import { sql } from "./db"
import { createAuditLog } from "./auth"
import { analyzeWithHuggingFace } from "./hf-integration"
import type { BotDetectionSession, BotDetectionEvent, BotVerdict } from "./types"

interface BotSignals {
  mouse_movements?: number
  clicks?: number
  keystrokes?: number
  scroll_events?: number
  touch_events?: number
  session_duration?: number
  page_views?: number
  behavior_score?: number
  fingerprint_score?: number
  ip_reputation_score?: number
  // AI Model Integration
  botd_score?: number
  ai_model_used?: boolean
  ai_prediction?: string
}

export async function createBotSession(
  organizationId: string,
  sessionId: string,
  userIdentifier?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  try {
    const result = await sql`
      INSERT INTO bot_detection_sessions (
        organization_id,
        session_id,
        user_identifier,
        ip_address,
        user_agent,
        verdict,
        signals
      ) VALUES (
        ${organizationId},
        ${sessionId},
        ${userIdentifier || null},
        ${ipAddress || null},
        ${userAgent || null},
        'unknown',
        '{}'
      )
      ON CONFLICT (session_id)
      DO UPDATE SET
        user_identifier = COALESCE(${userIdentifier}, bot_detection_sessions.user_identifier),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return result[0] as BotDetectionSession
  } catch (error) {
    console.error("[v0] Create bot session error:", error)
    throw error
  }
}

export async function recordBotEvent(sessionId: string, eventType: string, eventData: Record<string, any>) {
  try {
    // Get session from session_id
    const sessionResult = await sql`
      SELECT id FROM bot_detection_sessions WHERE session_id = ${sessionId} LIMIT 1
    `

    if (sessionResult.length === 0) {
      throw new Error("Session not found")
    }

    const result = await sql`
      INSERT INTO bot_detection_events (
        session_id,
        event_type,
        event_data
      ) VALUES (
        ${sessionResult[0].id},
        ${eventType},
        ${JSON.stringify(eventData)}
      )
      RETURNING *
    `

    return result[0] as BotDetectionEvent
  } catch (error) {
    console.error("[v0] Record bot event error:", error)
    throw error
  }
}

export async function calculateBotScore(signals: BotSignals): Promise<{ verdict: BotVerdict; confidence: number }> {
  let score = 0
  let maxScore = 0

  // Mouse movement analysis (0-20 points)
  if (signals.mouse_movements !== undefined) {
    maxScore += 20
    if (signals.mouse_movements > 50) score += 20
    else if (signals.mouse_movements > 20) score += 15
    else if (signals.mouse_movements > 5) score += 10
    else score += 0
  }

  // Click patterns (0-15 points)
  if (signals.clicks !== undefined) {
    maxScore += 15
    if (signals.clicks > 5 && signals.clicks < 100) score += 15
    else if (signals.clicks > 0) score += 8
    else score += 0
  }

  // Keystroke analysis (0-15 points)
  if (signals.keystrokes !== undefined) {
    maxScore += 15
    if (signals.keystrokes > 10) score += 15
    else if (signals.keystrokes > 0) score += 10
    else score += 0
  }

  // Scroll behavior (0-10 points)
  if (signals.scroll_events !== undefined) {
    maxScore += 10
    if (signals.scroll_events > 3) score += 10
    else if (signals.scroll_events > 0) score += 5
    else score += 0
  }

  // Session duration (0-15 points)
  if (signals.session_duration !== undefined) {
    maxScore += 15
    if (signals.session_duration > 30000)
      score += 15 // More than 30 seconds
    else if (signals.session_duration > 10000)
      score += 10 // More than 10 seconds
    else if (signals.session_duration > 3000)
      score += 5 // More than 3 seconds
    else score += 0
  }

  // Behavior score from client (0-15 points)
  if (signals.behavior_score !== undefined) {
    maxScore += 15
    score += signals.behavior_score * 15
  }

  // Fingerprint score (0-5 points)
  if (signals.fingerprint_score !== undefined) {
    maxScore += 5
    score += signals.fingerprint_score * 5
  }

  // IP reputation (0-5 points)
  if (signals.ip_reputation_score !== undefined) {
    maxScore += 5
    score += signals.ip_reputation_score * 5
  }

  const confidence = maxScore > 0 ? score / maxScore : 0

  let verdict: BotVerdict
  if (confidence >= 0.7) verdict = "human"
  else if (confidence >= 0.4) verdict = "suspicious"
  else if (confidence >= 0.2) verdict = "bot"
  else verdict = "unknown"

  return { verdict, confidence }
}

export async function analyzeBotSession(organizationId: string, sessionId: string) {
  try {
    // Get session
    const sessionResult = await sql`
      SELECT * FROM bot_detection_sessions WHERE session_id = ${sessionId} LIMIT 1
    `

    if (sessionResult.length === 0) {
      throw new Error("Session not found")
    }

    const session = sessionResult[0] as BotDetectionSession

    // Get all events for this session
    const events = await sql`
      SELECT * FROM bot_detection_events 
      WHERE session_id = ${session.id}
      ORDER BY timestamp ASC
    `

    // Calculate signals from events
    const signals: BotSignals = {
      mouse_movements: events.filter((e: any) => e.event_type === "mousemove").length,
      clicks: events.filter((e: any) => e.event_type === "click").length,
      keystrokes: events.filter((e: any) => e.event_type === "keypress").length,
      scroll_events: events.filter((e: any) => e.event_type === "scroll").length,
      touch_events: events.filter((e: any) => e.event_type === "touchstart").length,
      page_views: events.filter((e: any) => e.event_type === "pageview").length,
    }

    if (events.length > 0) {
      const firstEvent = events[0] as BotDetectionEvent
      const lastEvent = events[events.length - 1] as BotDetectionEvent
      signals.session_duration = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()
    }

    // Merge with existing signals
    const existingSignals = session.signals || {}
    const mergedSignals = { ...existingSignals, ...signals }

    // 🤖 AI MODEL INTEGRATION
    // Prepare forensic data for Hugging Face Model
    const forensicPayload = {
      mouse_trace: events
        .filter((e: any) => e.event_type === "mousemove" && e.event_data?.x !== undefined)
        .map((e: any) => ({
          x: Number(e.event_data.x),
          y: Number(e.event_data.y),
          t: Number(e.event_data.timestamp || new Date(e.timestamp).getTime())
        })),
      network_timestamps: events.map((e: any) => new Date(e.timestamp).getTime()),
      botd_score: mergedSignals.botd_score || 0.1
    }

    let aiVerdict: BotVerdict | null = null;
    let aiConfidence = 0;

    // Only call model if we have sufficient data
    if (forensicPayload.mouse_trace.length > 5) {
      const hfResult = await analyzeWithHuggingFace(forensicPayload);
      if (hfResult) {
        console.log(`🤖 Model Prediction: ${hfResult.label} (${hfResult.confidence})`);
        if (hfResult.is_bot) {
          aiVerdict = "bot";
          aiConfidence = hfResult.confidence;
        } else if (hfResult.confidence > 0.8) {
          aiVerdict = "human";
          aiConfidence = hfResult.confidence;
        }
      }
    }

    let { verdict, confidence } = await calculateBotScore(mergedSignals)

    // Override with AI verdict if confidence is high
    if (aiVerdict && aiConfidence > confidence) {
      verdict = aiVerdict;
      confidence = aiConfidence;
      mergedSignals.ai_model_used = true;
      mergedSignals.ai_prediction = aiVerdict;
    }

    // Update session with verdict
    const updatedSession = await sql`
      UPDATE bot_detection_sessions
      SET 
        verdict = ${verdict},
        confidence_score = ${confidence},
        signals = ${JSON.stringify(mergedSignals)},
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ${sessionId}
      RETURNING *
    `

    await createAuditLog(organizationId, "bot_analysis", "bot_detection_session", session.id, undefined, undefined, {
      verdict,
      confidence,
      signals: mergedSignals,
    })

    return updatedSession[0] as BotDetectionSession
  } catch (error) {
    console.error("[v0] Analyze bot session error:", error)
    throw error
  }
}

export async function getBotSession(sessionId: string) {
  try {
    const result = await sql`
      SELECT * FROM bot_detection_sessions WHERE session_id = ${sessionId} LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    return result[0] as BotDetectionSession
  } catch (error) {
    console.error("[v0] Get bot session error:", error)
    throw error
  }
}

export async function getBotSessionsByOrg(organizationId: string, limit = 100) {
  try {
    const result = await sql`
      SELECT * FROM bot_detection_sessions
      WHERE organization_id = ${organizationId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return result as BotDetectionSession[]
  } catch (error) {
    console.error("[v0] Get bot sessions error:", error)
    throw error
  }
}
