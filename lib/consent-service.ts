import { sql } from "./db"
import { createAuditLog } from "./auth"
import type { ConsentRecord, ConsentType, ConsentStatus } from "./types"

export async function createOrUpdateConsent(
  organizationId: string,
  userIdentifier: string,
  consentType: ConsentType,
  status: ConsentStatus,
  metadata: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string,
) {
  try {
    const result = await sql`
      INSERT INTO consent_records (
        organization_id,
        user_identifier,
        consent_type,
        status,
        ip_address,
        user_agent,
        metadata
      ) VALUES (
        ${organizationId},
        ${userIdentifier},
        ${consentType},
        ${status},
        ${ipAddress || null},
        ${userAgent || null},
        ${JSON.stringify(metadata)}
      )
      ON CONFLICT (organization_id, user_identifier, consent_type)
      DO UPDATE SET
        status = ${status},
        ip_address = ${ipAddress || null},
        user_agent = ${userAgent || null},
        metadata = ${JSON.stringify(metadata)},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const consent = result[0] as ConsentRecord

    await createAuditLog(organizationId, "consent_updated", "consent_record", consent.id, userIdentifier, ipAddress, {
      consent_type: consentType,
      status,
      metadata,
    })

    return consent
  } catch (error) {
    console.error("[v0] Consent creation error:", error)
    throw error
  }
}

export async function getConsents(organizationId: string, userIdentifier: string) {
  try {
    const result = await sql`
      SELECT * FROM consent_records
      WHERE organization_id = ${organizationId}
        AND user_identifier = ${userIdentifier}
      ORDER BY created_at DESC
    `

    return result as ConsentRecord[]
  } catch (error) {
    console.error("[v0] Get consents error:", error)
    throw error
  }
}

export async function getConsentHistory(organizationId: string, userIdentifier: string, consentType?: ConsentType) {
  try {
    const result = consentType
      ? await sql`
          SELECT * FROM consent_records
          WHERE organization_id = ${organizationId}
            AND user_identifier = ${userIdentifier}
            AND consent_type = ${consentType}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT * FROM consent_records
          WHERE organization_id = ${organizationId}
            AND user_identifier = ${userIdentifier}
          ORDER BY created_at DESC
        `

    return result as ConsentRecord[]
  } catch (error) {
    console.error("[v0] Get consent history error:", error)
    throw error
  }
}

export async function revokeConsent(
  organizationId: string,
  userIdentifier: string,
  consentType: ConsentType,
  ipAddress?: string,
) {
  return createOrUpdateConsent(
    organizationId,
    userIdentifier,
    consentType,
    "denied",
    { revoked_at: new Date().toISOString() },
    ipAddress,
  )
}

export async function batchUpdateConsents(
  organizationId: string,
  userIdentifier: string,
  consents: Array<{ type: ConsentType; status: ConsentStatus }>,
  metadata: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string,
) {
  const results = await Promise.all(
    consents.map((consent) =>
      createOrUpdateConsent(
        organizationId,
        userIdentifier,
        consent.type,
        consent.status,
        metadata,
        ipAddress,
        userAgent,
      ),
    ),
  )

  return results
}

export async function exportConsents(organizationId: string, userIdentifier: string) {
  const consents = await getConsents(organizationId, userIdentifier)

  const exportData = {
    user_identifier: userIdentifier,
    export_date: new Date().toISOString(),
    consents: consents.map((c) => ({
      type: c.consent_type,
      status: c.status,
      granted_at: c.created_at,
      updated_at: c.updated_at,
      metadata: c.metadata,
    })),
  }

  await createAuditLog(organizationId, "consent_export", "consent_record", undefined, userIdentifier)

  return exportData
}

export async function deleteUserConsents(organizationId: string, userIdentifier: string, ipAddress?: string) {
  try {
    await sql`
      DELETE FROM consent_records
      WHERE organization_id = ${organizationId}
        AND user_identifier = ${userIdentifier}
    `

    await createAuditLog(organizationId, "consent_deleted", "consent_record", undefined, userIdentifier, ipAddress)

    return true
  } catch (error) {
    console.error("[v0] Delete consents error:", error)
    throw error
  }
}
