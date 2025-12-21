import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey || apiKey !== 'demo_api_key_12345678901234567890123456789012') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all consent records
    const consents = await sql`
      SELECT 
        id,
        user_identifier,
        consent_type,
        status,
        metadata,
        ip_address,
        created_at,
        updated_at
      FROM consent_records
      ORDER BY updated_at DESC
      LIMIT 100
    `

    // Fetch audit logs
    const auditLogs = await sql`
      SELECT 
        id,
        action,
        resource_type,
        user_identifier,
        changes,
        created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      consents,
      auditLogs,
    })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
