import { sql } from "./db"
import { createAuditLog } from "./auth"

/**
 * BotD Integration Service
 * 
 * Handles database operations for BotD (Fingerprint) bot detection
 * Features: Detection results logging, blocking events, whitelist, statistics
 */

export interface BotDDetectionResult {
    id?: string
    organization_id: string
    bot_detected: boolean
    bot_kind?: string
    detection_source?: 'botd_library' | 'fallback' | 'whitelist'
    url: string
    ip_address?: string
    user_agent?: string
    referrer?: string
    botd_request_time?: number
    botd_components?: Record<string, any>
    metadata?: Record<string, any>
    session_id?: string
    created_at?: Date
}

export interface BotDBlockedEvent {
    id?: string
    organization_id: string
    bot_kind: string
    detection_source?: 'botd_library' | 'fallback' | 'whitelist'
    url: string
    ip_address?: string
    user_agent?: string
    blocked_at?: Date
    block_reason?: string
    appealed?: boolean
    appeal_email?: string
    appeal_message?: string
    metadata?: Record<string, any>
    created_at?: Date
}

export interface BotWhitelistEntry {
    id?: string
    organization_id: string
    whitelist_type: 'user_agent_pattern' | 'ip_address' | 'ip_range'
    pattern_value: string
    description?: string
    auto_added?: boolean
    is_active?: boolean
    created_by?: string
    created_at?: Date
    updated_at?: Date
}

export interface BotDStatistics {
    organization_id: string
    date: string
    hour: number
    total_detections: number
    bots_detected: number
    bots_blocked: number
    humans_detected: number
    whitelisted_bots: number
    bot_type_breakdown: Record<string, number>
    avg_detection_time_ms?: number
}

/**
 * Log a bot detection result from the browser extension
 */
export async function logBotDetectionResult(data: BotDDetectionResult) {
    try {
        const result = await sql`
      INSERT INTO botd_detection_results (
        organization_id,
        bot_detected,
        bot_kind,
        detection_source,
        url,
        ip_address,
        user_agent,
        referrer,
        botd_request_time,
        botd_components,
        metadata,
        session_id
      ) VALUES (
        ${data.organization_id},
        ${data.bot_detected},
        ${data.bot_kind || null},
        ${data.detection_source || 'botd_library'},
        ${data.url},
        ${data.ip_address || null},
        ${data.user_agent || null},
        ${data.referrer || null},
        ${data.botd_request_time || null},
        ${data.botd_components ? JSON.stringify(data.botd_components) : '{}'},
        ${data.metadata ? JSON.stringify(data.metadata) : '{}'},
        ${data.session_id || null}
      )
      RETURNING *
    `

        // Update statistics asynchronously (don't await)
        updateStatistics(data.organization_id, data.bot_detected).catch(err =>
            console.error('[BotD] Failed to update statistics:', err)
        )

        // Create audit log
        await createAuditLog(
            data.organization_id,
            'bot_detection',
            'botd_detection_result',
            result[0].id,
            undefined,
            undefined,
            {
                bot_detected: data.bot_detected,
                bot_kind: data.bot_kind,
                url: data.url
            }
        )

        return result[0] as BotDDetectionResult
    } catch (error) {
        console.error('[BotD] Log detection result error:', error)
        throw error
    }
}

/**
 * Log a bot blocking event
 */
export async function logBotBlockedEvent(data: BotDBlockedEvent) {
    try {
        const result = await sql`
      INSERT INTO botd_blocked_events (
        organization_id,
        bot_kind,
        detection_source,
        url,
        ip_address,
        user_agent,
        block_reason,
        metadata
      ) VALUES (
        ${data.organization_id},
        ${data.bot_kind},
        ${data.detection_source || 'botd_library'},
        ${data.url},
        ${data.ip_address || null},
        ${data.user_agent || null},
        ${data.block_reason || 'Automated bot detected'},
        ${data.metadata ? JSON.stringify(data.metadata) : '{}'}
      )
      RETURNING *
    `

        // Update statistics
        updateStatistics(data.organization_id, true, true).catch(err =>
            console.error('[BotD] Failed to update block statistics:', err)
        )

        // Create audit log
        await createAuditLog(
            data.organization_id,
            'bot_blocked',
            'botd_blocked_event',
            result[0].id,
            undefined,
            undefined,
            {
                bot_kind: data.bot_kind,
                url: data.url,
                ip_address: data.ip_address
            }
        )

        return result[0] as BotDBlockedEvent
    } catch (error) {
        console.error('[BotD] Log blocked event error:', error)
        throw error
    }
}

/**
 * Check if a user agent or IP is whitelisted
 */
export async function isWhitelisted(
    organizationId: string,
    userAgent?: string,
    ipAddress?: string
): Promise<boolean> {
    try {
        if (!userAgent && !ipAddress) {
            return false
        }

        // Check user agent patterns
        if (userAgent) {
            const uaResult = await sql`
        SELECT * FROM bot_whitelist
        WHERE organization_id = ${organizationId}
          AND whitelist_type = 'user_agent_pattern'
          AND is_active = TRUE
          AND ${userAgent} ~* pattern_value
        LIMIT 1
      `

            if (uaResult.length > 0) {
                return true
            }
        }

        // Check IP address
        if (ipAddress) {
            const ipResult = await sql`
        SELECT * FROM bot_whitelist
        WHERE organization_id = ${organizationId}
          AND whitelist_type IN ('ip_address', 'ip_range')
          AND is_active = TRUE
          AND pattern_value = ${ipAddress}
        LIMIT 1
      `

            if (ipResult.length > 0) {
                return true
            }
        }

        return false
    } catch (error) {
        console.error('[BotD] Whitelist check error:', error)
        return false
    }
}

/**
 * Add entry to whitelist
 */
export async function addToWhitelist(data: BotWhitelistEntry) {
    try {
        const result = await sql`
      INSERT INTO bot_whitelist (
        organization_id,
        whitelist_type,
        pattern_value,
        description,
        auto_added,
        is_active,
        created_by
      ) VALUES (
        ${data.organization_id},
        ${data.whitelist_type},
        ${data.pattern_value},
        ${data.description || null},
        ${data.auto_added || false},
        ${data.is_active !== false},
        ${data.created_by || null}
      )
      ON CONFLICT (organization_id, whitelist_type, pattern_value)
      DO UPDATE SET
        is_active = EXCLUDED.is_active,
        description = COALESCE(EXCLUDED.description, bot_whitelist.description),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

        await createAuditLog(
            data.organization_id,
            'whitelist_add',
            'bot_whitelist',
            result[0].id,
            undefined,
            undefined,
            { pattern: data.pattern_value, type: data.whitelist_type }
        )

        return result[0] as BotWhitelistEntry
    } catch (error) {
        console.error('[BotD] Add to whitelist error:', error)
        throw error
    }
}

/**
 * Get whitelist entries
 */
export async function getWhitelist(organizationId: string, activeOnly = true) {
    try {
        const result = await sql`
      SELECT * FROM bot_whitelist
      WHERE organization_id = ${organizationId}
        ${activeOnly ? sql`AND is_active = TRUE` : sql``}
      ORDER BY created_at DESC
    `

        return result as BotWhitelistEntry[]
    } catch (error) {
        console.error('[BotD] Get whitelist error:', error)
        throw error
    }
}

/**
 * Update statistics (called internally)
 */
async function updateStatistics(
    organizationId: string,
    botDetected: boolean,
    blocked = false
) {
    try {
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const hour = now.getHours()

        await sql`
      INSERT INTO botd_statistics (
        organization_id,
        date,
        hour,
        total_detections,
        bots_detected,
        bots_blocked,
        humans_detected,
        whitelisted_bots
      ) VALUES (
        ${organizationId},
        ${dateStr},
        ${hour},
        1,
        ${botDetected ? 1 : 0},
        ${blocked ? 1 : 0},
        ${!botDetected ? 1 : 0},
        0
      )
      ON CONFLICT (organization_id, date, hour)
      DO UPDATE SET
        total_detections = botd_statistics.total_detections + 1,
        bots_detected = botd_statistics.bots_detected + ${botDetected ? 1 : 0},
        bots_blocked = botd_statistics.bots_blocked + ${blocked ? 1 : 0},
        humans_detected = botd_statistics.humans_detected + ${!botDetected ? 1 : 0},
        updated_at = CURRENT_TIMESTAMP
    `
    } catch (error) {
        console.error('[BotD] Update statistics error:', error)
        // Don't throw - statistics are not critical
    }
}

/**
 * Get statistics for a date range
 */
export async function getStatistics(
    organizationId: string,
    startDate: string,
    endDate: string
): Promise<BotDStatistics[]> {
    try {
        const result = await sql`
      SELECT * FROM botd_statistics
      WHERE organization_id = ${organizationId}
        AND date >= ${startDate}
        AND date <= ${endDate}
      ORDER BY date DESC, hour DESC
    `

        return result as BotDStatistics[]
    } catch (error) {
        console.error('[BotD] Get statistics error:', error)
        throw error
    }
}

/**
 * Get summary statistics
 */
export async function getSummaryStatistics(organizationId: string) {
    try {
        // Last 24 hours
        const last24Hours = await sql`
      SELECT 
        COALESCE(SUM(total_detections), 0) as total_detections,
        COALESCE(SUM(bots_detected), 0) as bots_detected,
        COALESCE(SUM(bots_blocked), 0) as bots_blocked,
        COALESCE(SUM(humans_detected), 0) as humans_detected,
        COALESCE(SUM(whitelisted_bots), 0) as whitelisted_bots
      FROM botd_statistics
      WHERE organization_id = ${organizationId}
        AND created_at >= NOW() - INTERVAL '24 hours'
    `

        // Last 7 days
        const last7Days = await sql`
      SELECT 
        COALESCE(SUM(total_detections), 0) as total_detections,
        COALESCE(SUM(bots_detected), 0) as bots_detected,
        COALESCE(SUM(bots_blocked), 0) as bots_blocked,
        COALESCE(SUM(humans_detected), 0) as humans_detected,
        COALESCE(SUM(whitelisted_bots), 0) as whitelisted_bots
      FROM botd_statistics
      WHERE organization_id = ${organizationId}
        AND date >= CURRENT_DATE - INTERVAL '7 days'
    `

        // All time
        const allTime = await sql`
      SELECT 
        COALESCE(SUM(total_detections), 0) as total_detections,
        COALESCE(SUM(bots_detected), 0) as bots_detected,
        COALESCE(SUM(bots_blocked), 0) as bots_blocked,
        COALESCE(SUM(humans_detected), 0) as humans_detected,
        COALESCE(SUM(whitelisted_bots), 0) as whitelisted_bots
      FROM botd_statistics
      WHERE organization_id = ${organizationId}
    `

        return {
            last_24_hours: last24Hours[0],
            last_7_days: last7Days[0],
            all_time: allTime[0]
        }
    } catch (error) {
        console.error('[BotD] Get summary statistics error:', error)
        throw error
    }
}

/**
 * Get recent detection results
 */
export async function getRecentDetections(organizationId: string, limit = 50) {
    try {
        const result = await sql`
      SELECT * FROM botd_detection_results
      WHERE organization_id = ${organizationId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

        return result as BotDDetectionResult[]
    } catch (error) {
        console.error('[BotD] Get recent detections error:', error)
        throw error
    }
}

/**
 * Get recent blocked events
 */
export async function getRecentBlockedEvents(organizationId: string, limit = 50) {
    try {
        const result = await sql`
      SELECT * FROM botd_blocked_events
      WHERE organization_id = ${organizationId}
      ORDER BY blocked_at DESC
      LIMIT ${limit}
    `

        return result as BotDBlockedEvent[]
    } catch (error) {
        console.error('[BotD] Get recent blocked events error:', error)
        throw error
    }
}
