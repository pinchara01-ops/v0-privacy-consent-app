import { sql } from "./db"
import { createAuditLog } from "./auth"
import type { ConsentProof, ProofStatus } from "./types"
import crypto from "crypto"

export interface ProofData {
  consent_id: string
  user_identifier: string
  consent_type: string
  status: string
  timestamp: string
  ip_address?: string
  user_agent?: string
  metadata: Record<string, any>
}

export function generateProofHash(proofData: ProofData): string {
  const canonical = JSON.stringify(proofData, Object.keys(proofData).sort())
  return crypto.createHash("sha256").update(canonical).digest("hex")
}

export async function createConsentProof(organizationId: string, consentId: string, proofData: ProofData) {
  try {
    const proofHash = generateProofHash(proofData)

    const result = await sql`
      INSERT INTO consent_proofs (
        consent_id,
        proof_hash,
        proof_data,
        status
      ) VALUES (
        ${consentId},
        ${proofHash},
        ${JSON.stringify(proofData)},
        'pending'
      )
      ON CONFLICT (proof_hash)
      DO UPDATE SET
        proof_data = ${JSON.stringify(proofData)},
        status = 'pending'
      RETURNING *
    `

    const proof = result[0] as ConsentProof

    await createAuditLog(organizationId, "proof_created", "consent_proof", proof.id, proofData.user_identifier)

    return proof
  } catch (error) {
    console.error("[v0] Create proof error:", error)
    throw error
  }
}

export async function verifyConsentProof(proofHash: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT cp.*, cr.*
      FROM consent_proofs cp
      JOIN consent_records cr ON cp.consent_id = cr.id
      WHERE cp.proof_hash = ${proofHash}
      LIMIT 1
    `

    if (result.length === 0) {
      return false
    }

    const proof = result[0]

    // Reconstruct proof data from consent record
    const reconstructedData: ProofData = {
      consent_id: proof.consent_id,
      user_identifier: proof.user_identifier,
      consent_type: proof.consent_type,
      status: proof.status,
      timestamp: proof.created_at,
      ip_address: proof.ip_address,
      user_agent: proof.user_agent,
      metadata: proof.metadata,
    }

    const reconstructedHash = generateProofHash(reconstructedData)

    return reconstructedHash === proofHash
  } catch (error) {
    console.error("[v0] Verify proof error:", error)
    return false
  }
}

export async function getProofByHash(proofHash: string) {
  try {
    const result = await sql`
      SELECT cp.*, cr.user_identifier, cr.consent_type, cr.status as consent_status
      FROM consent_proofs cp
      JOIN consent_records cr ON cp.consent_id = cr.id
      WHERE cp.proof_hash = ${proofHash}
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error("[v0] Get proof by hash error:", error)
    throw error
  }
}

export async function getProofsByConsent(consentId: string) {
  try {
    const result = await sql`
      SELECT * FROM consent_proofs
      WHERE consent_id = ${consentId}
      ORDER BY created_at DESC
    `

    return result as ConsentProof[]
  } catch (error) {
    console.error("[v0] Get proofs by consent error:", error)
    throw error
  }
}

export async function updateProofStatus(proofId: string, status: ProofStatus, blockchainTxId?: string) {
  try {
    const result = await sql`
      UPDATE consent_proofs
      SET 
        status = ${status},
        blockchain_tx_id = ${blockchainTxId || null},
        verified_at = ${status === "verified" ? new Date().toISOString() : null}
      WHERE id = ${proofId}
      RETURNING *
    `

    return result[0] as ConsentProof
  } catch (error) {
    console.error("[v0] Update proof status error:", error)
    throw error
  }
}

export async function generateProofCertificate(proofHash: string) {
  const proof = await getProofByHash(proofHash)

  if (!proof) {
    throw new Error("Proof not found")
  }

  const isValid = await verifyConsentProof(proofHash)

  const certificate = {
    proof_hash: proofHash,
    consent_type: proof.consent_type,
    consent_status: proof.consent_status,
    user_identifier: proof.user_identifier,
    timestamp: proof.created_at,
    verified: isValid,
    verification_date: new Date().toISOString(),
    blockchain_tx_id: proof.blockchain_tx_id,
    certificate_url: `https://verify.example.com/proof/${proofHash}`,
  }

  return certificate
}

export async function batchVerifyProofs(proofHashes: string[]) {
  const results = await Promise.all(
    proofHashes.map(async (hash) => ({
      proof_hash: hash,
      verified: await verifyConsentProof(hash),
    })),
  )

  return results
}
