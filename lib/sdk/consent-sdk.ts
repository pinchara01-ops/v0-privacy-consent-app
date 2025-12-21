export interface ConsentSDKConfig {
  apiKey: string
  apiEndpoint?: string
}

export interface ConsentOptions {
  userIdentifier: string
  consentType: "marketing" | "analytics" | "functional" | "personalization"
  status: "granted" | "denied"
  metadata?: Record<string, any>
}

export interface BatchConsentOptions {
  userIdentifier: string
  consents: Array<{
    type: "marketing" | "analytics" | "functional" | "personalization"
    status: "granted" | "denied"
  }>
  metadata?: Record<string, any>
}

export class ConsentSDK {
  private apiKey: string
  private apiEndpoint: string

  constructor(config: ConsentSDKConfig) {
    this.apiKey = config.apiKey
    this.apiEndpoint = config.apiEndpoint || "https://api.yourapp.com"
  }

  async createConsent(options: ConsentOptions) {
    const response = await fetch(`${this.apiEndpoint}/api/consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        user_identifier: options.userIdentifier,
        consent_type: options.consentType,
        status: options.status,
        metadata: options.metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create consent: ${response.statusText}`)
    }

    return await response.json()
  }

  async batchUpdateConsents(options: BatchConsentOptions) {
    const response = await fetch(`${this.apiEndpoint}/api/consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        user_identifier: options.userIdentifier,
        consents: options.consents,
        metadata: options.metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to batch update consents: ${response.statusText}`)
    }

    return await response.json()
  }

  async getConsents(userIdentifier: string) {
    const response = await fetch(
      `${this.apiEndpoint}/api/consent?user_identifier=${encodeURIComponent(userIdentifier)}`,
      {
        headers: {
          "x-api-key": this.apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to get consents: ${response.statusText}`)
    }

    return await response.json()
  }

  async revokeConsent(userIdentifier: string, consentType: string) {
    const response = await fetch(`${this.apiEndpoint}/api/consent/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        user_identifier: userIdentifier,
        consent_type: consentType,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to revoke consent: ${response.statusText}`)
    }

    return await response.json()
  }

  async exportConsents(userIdentifier: string) {
    const response = await fetch(
      `${this.apiEndpoint}/api/consent/export?user_identifier=${encodeURIComponent(userIdentifier)}`,
      {
        headers: {
          "x-api-key": this.apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to export consents: ${response.statusText}`)
    }

    return await response.json()
  }
}

export class BotDetectionSDK {
  private apiKey: string
  private apiEndpoint: string

  constructor(config: ConsentSDKConfig) {
    this.apiKey = config.apiKey
    this.apiEndpoint = config.apiEndpoint || "https://api.yourapp.com"
  }

  async createSession(sessionId: string, userIdentifier?: string) {
    const response = await fetch(`${this.apiEndpoint}/api/bot-detection/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_identifier: userIdentifier,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`)
    }

    return await response.json()
  }

  async recordEvent(sessionId: string, eventType: string, eventData?: Record<string, any>) {
    const response = await fetch(`${this.apiEndpoint}/api/bot-detection/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to record event: ${response.statusText}`)
    }

    return await response.json()
  }

  async analyzeSession(sessionId: string) {
    const response = await fetch(`${this.apiEndpoint}/api/bot-detection/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to analyze session: ${response.statusText}`)
    }

    return await response.json()
  }

  async getSession(sessionId: string) {
    const response = await fetch(
      `${this.apiEndpoint}/api/bot-detection/session?session_id=${encodeURIComponent(sessionId)}`,
      {
        headers: {
          "x-api-key": this.apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`)
    }

    return await response.json()
  }
}

export class ProofSDK {
  private apiKey: string
  private apiEndpoint: string

  constructor(config: ConsentSDKConfig) {
    this.apiKey = config.apiKey
    this.apiEndpoint = config.apiEndpoint || "https://api.yourapp.com"
  }

  async createProof(consentId: string) {
    const response = await fetch(`${this.apiEndpoint}/api/proof/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        consent_id: consentId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create proof: ${response.statusText}`)
    }

    return await response.json()
  }

  async verifyProof(proofHash: string) {
    const response = await fetch(`${this.apiEndpoint}/api/proof/verify?proof_hash=${encodeURIComponent(proofHash)}`, {
      headers: {
        "x-api-key": this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to verify proof: ${response.statusText}`)
    }

    return await response.json()
  }

  async getCertificate(proofHash: string) {
    const response = await fetch(
      `${this.apiEndpoint}/api/proof/certificate?proof_hash=${encodeURIComponent(proofHash)}`,
    )

    if (!response.ok) {
      throw new Error(`Failed to get certificate: ${response.statusText}`)
    }

    return await response.json()
  }

  async batchVerifyProofs(proofHashes: string[]) {
    const response = await fetch(`${this.apiEndpoint}/api/proof/batch-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        proof_hashes: proofHashes,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to batch verify proofs: ${response.statusText}`)
    }

    return await response.json()
  }
}

export class PrivacySDK {
  public consent: ConsentSDK
  public botDetection: BotDetectionSDK
  public proof: ProofSDK

  constructor(config: ConsentSDKConfig) {
    this.consent = new ConsentSDK(config)
    this.botDetection = new BotDetectionSDK(config)
    this.proof = new ProofSDK(config)
  }
}
