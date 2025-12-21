# API Documentation

## Authentication

All API endpoints require authentication using an API key passed in the request header:

```
x-api-key: your_api_key_here
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": "error message if failed",
  "message": "optional message"
}
```

## Consent Management API

### Create or Update Consent

**Endpoint**: `POST /api/consent`

**Request Body**:
```json
{
  "user_identifier": "user@example.com",
  "consent_type": "marketing",
  "status": "granted",
  "metadata": {
    "source": "website",
    "page": "/signup"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "user_identifier": "user@example.com",
    "consent_type": "marketing",
    "status": "granted",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

### Batch Update Consents

**Endpoint**: `POST /api/consent`

**Request Body**:
```json
{
  "user_identifier": "user@example.com",
  "consents": [
    { "type": "marketing", "status": "granted" },
    { "type": "analytics", "status": "granted" },
    { "type": "functional", "status": "denied" }
  ],
  "metadata": {
    "source": "preferences_page"
  }
}
```

### Get User Consents

**Endpoint**: `GET /api/consent?user_identifier=email`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "consent_type": "marketing",
      "status": "granted",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Revoke Consent

**Endpoint**: `POST /api/consent/revoke`

**Request Body**:
```json
{
  "user_identifier": "user@example.com",
  "consent_type": "marketing"
}
```

### Export User Consents

**Endpoint**: `GET /api/consent/export?user_identifier=email`

**Response**:
```json
{
  "success": true,
  "data": {
    "user_identifier": "user@example.com",
    "export_date": "2025-01-01T00:00:00Z",
    "consents": [
      {
        "type": "marketing",
        "status": "granted",
        "granted_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z",
        "metadata": {}
      }
    ]
  }
}
```

## Bot Detection API

### Create Session

**Endpoint**: `POST /api/bot-detection/session`

**Request Body**:
```json
{
  "session_id": "unique-session-id",
  "user_identifier": "user@example.com"
}
```

### Record Event

**Endpoint**: `POST /api/bot-detection/event`

**Request Body**:
```json
{
  "session_id": "unique-session-id",
  "event_type": "click",
  "event_data": {
    "x": 100,
    "y": 200,
    "count": 1
  }
}
```

**Supported Event Types**:
- `mousemove`
- `click`
- `keypress`
- `scroll`
- `touchstart`
- `pageview`

### Analyze Session

**Endpoint**: `POST /api/bot-detection/analyze`

**Request Body**:
```json
{
  "session_id": "unique-session-id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "session_id": "unique-session-id",
    "verdict": "human",
    "confidence_score": 0.85,
    "signals": {
      "mouse_movements": 150,
      "clicks": 12,
      "keystrokes": 45,
      "scroll_events": 8,
      "session_duration": 45000
    }
  }
}
```

**Verdict Types**:
- `human` - Confidence >= 0.7
- `suspicious` - Confidence >= 0.4
- `bot` - Confidence >= 0.2
- `unknown` - Confidence < 0.2

### Get Session

**Endpoint**: `GET /api/bot-detection/session?session_id=id`

## Consent Proof API

### Create Proof

**Endpoint**: `POST /api/proof/create`

**Request Body**:
```json
{
  "consent_id": "consent-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "consent_id": "consent-uuid",
    "proof_hash": "sha256-hash",
    "status": "pending",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### Verify Proof

**Endpoint**: `GET /api/proof/verify?proof_hash=hash`

**Response**:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "proof": {
      "id": "uuid",
      "proof_hash": "hash",
      "status": "verified",
      "consent_type": "marketing",
      "user_identifier": "user@example.com"
    }
  }
}
```

### Get Certificate

**Endpoint**: `GET /api/proof/certificate?proof_hash=hash`

**Response**:
```json
{
  "success": true,
  "data": {
    "proof_hash": "hash",
    "consent_type": "marketing",
    "consent_status": "granted",
    "user_identifier": "user@example.com",
    "timestamp": "2025-01-01T00:00:00Z",
    "verified": true,
    "verification_date": "2025-01-01T00:00:00Z",
    "certificate_url": "https://verify.example.com/proof/hash"
  }
}
```

### Batch Verify Proofs

**Endpoint**: `POST /api/proof/batch-verify`

**Request Body**:
```json
{
  "proof_hashes": ["hash1", "hash2", "hash3"]
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    { "proof_hash": "hash1", "verified": true },
    { "proof_hash": "hash2", "verified": true },
    { "proof_hash": "hash3", "verified": false }
  ]
}
```

## Error Codes

- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid API key)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Rate Limiting

API rate limits (if implemented):
- 1000 requests per hour per API key
- 100 requests per minute per API key
