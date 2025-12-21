# Privacy Consent Management System

A production-grade consent management, bot detection, and consent proof system with full GDPR/CCPA compliance.

## Features

- **Consent Management**: Full CRUD operations for user consent preferences
- **Bot Detection**: Behavioral analysis with confidence scoring
- **Consent Proofs**: Cryptographic proof generation and verification
- **Audit Logging**: Complete audit trail for all operations
- **API-First**: RESTful APIs with comprehensive SDK support

## Quick Start

### Installation

```bash
npm install
```

### Database Setup

Run the SQL scripts to set up your database:

```bash
# Execute scripts in order
node scripts/001_create_schema.sql
node scripts/002_seed_data.sql
```

### Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL=your_neon_database_url
```

### Run Development Server

```bash
npm run dev
```

## SDK Usage

### Initialize SDK

```typescript
import { PrivacySDK } from '@/lib/sdk/consent-sdk'

const sdk = new PrivacySDK({
  apiKey: 'your_api_key',
  apiEndpoint: 'https://your-api.com'
})
```

### Consent Management

```typescript
// Create or update consent
await sdk.consent.createConsent({
  userIdentifier: 'user@example.com',
  consentType: 'marketing',
  status: 'granted',
  metadata: { source: 'website' }
})

// Batch update consents
await sdk.consent.batchUpdateConsents({
  userIdentifier: 'user@example.com',
  consents: [
    { type: 'marketing', status: 'granted' },
    { type: 'analytics', status: 'granted' }
  ]
})

// Get all consents
const consents = await sdk.consent.getConsents('user@example.com')

// Revoke consent
await sdk.consent.revokeConsent('user@example.com', 'marketing')

// Export consents (GDPR compliance)
const exportData = await sdk.consent.exportConsents('user@example.com')
```

### Bot Detection

```typescript
// Create session
await sdk.botDetection.createSession('session-123', 'user@example.com')

// Record events
await sdk.botDetection.recordEvent('session-123', 'click', { x: 100, y: 200 })
await sdk.botDetection.recordEvent('session-123', 'mousemove', { count: 50 })

// Analyze session
const analysis = await sdk.botDetection.analyzeSession('session-123')
console.log(analysis.data.verdict) // 'human', 'bot', 'suspicious', or 'unknown'
console.log(analysis.data.confidence_score) // 0.0 to 1.0
```

### Consent Proofs

```typescript
// Create proof for consent
const proof = await sdk.proof.createProof('consent-id-123')
console.log(proof.data.proof_hash) // SHA-256 hash

// Verify proof
const verification = await sdk.proof.verifyProof('proof-hash-here')
console.log(verification.data.verified) // true or false

// Get certificate
const certificate = await sdk.proof.getCertificate('proof-hash-here')

// Batch verify multiple proofs
const results = await sdk.proof.batchVerifyProofs(['hash1', 'hash2', 'hash3'])
```

## API Endpoints

### Consent Management

- `POST /api/consent` - Create or update consent
- `GET /api/consent?user_identifier=email` - Get all consents
- `POST /api/consent/revoke` - Revoke consent
- `GET /api/consent/export?user_identifier=email` - Export consents

### Bot Detection

- `POST /api/bot-detection/session` - Create session
- `GET /api/bot-detection/session?session_id=id` - Get session
- `POST /api/bot-detection/event` - Record event
- `POST /api/bot-detection/analyze` - Analyze session

### Consent Proofs

- `POST /api/proof/create` - Create proof
- `GET /api/proof/verify?proof_hash=hash` - Verify proof
- `GET /api/proof/certificate?proof_hash=hash` - Get certificate
- `POST /api/proof/batch-verify` - Batch verify proofs

## Authentication

All API requests require an API key in the header:

```bash
x-api-key: your_api_key_here
```

## Database Schema

### Tables

- `organizations` - Organization accounts
- `consent_records` - User consent records
- `bot_detection_sessions` - Bot detection sessions
- `bot_detection_events` - Bot detection events
- `consent_proofs` - Cryptographic proofs
- `audit_logs` - Audit trail

## Client-Side Integration

```typescript
import { BotDetectionClient } from '@/lib/bot-detection-client'

// Initialize on page load
const detector = new BotDetectionClient('session-123')

// Analyze when needed (e.g., before form submission)
const result = await detector.analyze()
if (result.data.verdict === 'bot') {
  // Handle bot detection
}

// Clean up on unmount
detector.destroy()
```

## Compliance Features

### GDPR

- Right to access: `GET /api/consent/export`
- Right to erasure: `DELETE /api/consent`
- Audit logging: All operations logged
- Consent withdrawal: `POST /api/consent/revoke`

### CCPA

- Data export capabilities
- Consent management
- Audit trails
- User data deletion

## Security

- API key authentication
- Cryptographic proof hashing (SHA-256)
- IP address logging
- User agent tracking
- Audit logging for all operations

## Performance

- Database indexes on frequently queried columns
- Batch operations support
- Event buffering for bot detection
- Optimized queries with proper JOINs

## License

MIT
