export type ConsentType = "marketing" | "analytics" | "functional" | "personalization"
export type ConsentStatus = "granted" | "denied" | "pending"
export type BotVerdict = "human" | "bot" | "suspicious" | "unknown"
export type ProofStatus = "pending" | "verified" | "failed" | "expired"

export interface Organization {
  id: string
  name: string
  api_key: string
  webhook_url?: string
  settings: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface ConsentRecord {
  id: string
  organization_id: string
  user_identifier: string
  consent_type: ConsentType
  status: ConsentStatus
  ip_address?: string
  user_agent?: string
  metadata: Record<string, any>
  version: string
  created_at: Date
  updated_at: Date
  expires_at?: Date
}

export interface BotDetectionSession {
  id: string
  session_id: string
  organization_id: string
  user_identifier?: string
  ip_address?: string
  user_agent?: string
  verdict: BotVerdict
  confidence_score?: number
  signals: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface BotDetectionEvent {
  id: string
  session_id: string
  event_type: string
  event_data: Record<string, any>
  timestamp: Date
}

export interface ConsentProof {
  id: string
  consent_id: string
  proof_hash: string
  proof_data: Record<string, any>
  blockchain_tx_id?: string
  status: ProofStatus
  verified_at?: Date
  created_at: Date
}

export interface AuditLog {
  id: string
  organization_id: string
  action: string
  resource_type: string
  resource_id?: string
  user_identifier?: string
  ip_address?: string
  changes?: Record<string, any>
  created_at: Date
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
