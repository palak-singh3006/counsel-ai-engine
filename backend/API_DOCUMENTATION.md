# Counsel Main Backend — API Documentation

Base URL (local default): `http://localhost:5000/api`
Health Check: `GET http://localhost:5000/health` (and `GET http://localhost:5000/api/health`)

## Standard Response Envelope

### Success
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error
```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": {
    "code": "ERROR_CODE"
  }
}
```

All protected endpoints require header:
`Authorization: Bearer <supabase_access_token>`

---

## 1. Health Check
- `GET /health` or `GET /api/health` (Public)
  Returns backend status, Supabase configuration check, and AI Engine connectivity.

---

## 2. Authentication & Profile
- `POST /api/auth/register` (Public) — Body: `{ email, password, full_name?, firm_name?, phone? }`
- `POST /api/auth/login` (Public) — Body: `{ email, password }` -> returns `{ token, refreshToken, user, profile }`
- `POST /api/auth/logout` (Protected)
- `GET /api/auth/me` (Protected) -> returns current authenticated user + `advocate_profiles`
- `PUT /api/auth/profile` (Protected) -> updates advocate profile, firm settings, and notification preferences

---

## 3. Clients
- `GET /api/clients` (Protected) — Query: `?search=&type=&status=`
- `POST /api/clients` (Protected) — Body: `{ full_name, phone, email?, address?, client_type?, status?, notes? }`
- `GET /api/clients/:id` (Protected) — Returns client + associated `cases`
- `PUT /api/clients/:id` (Protected)
- `DELETE /api/clients/:id` (Protected) — Returns `409 CLIENT_HAS_CASES` if linked cases exist

---

## 4. Matters / Cases
- `GET /api/cases` (Protected) — Query: `?status=&caseType=&search=&clientId=`
- `POST /api/cases` (Protected) — Body: `{ title, client_id, court_name, case_type?, case_number?, judge_name?, filing_date?, status?, assigned_advocate?, description?, next_hearing_date? }`
- `GET /api/cases/:id` (Protected) — Returns case dossier with `hearings`, `documents`, `payments`, and `ai_analyses`
- `PUT /api/cases/:id` (Protected)
- `DELETE /api/cases/:id` (Protected)

---

## 5. Hearings
- `GET /api/hearings` (Protected) — Query filters: `?caseId=&hearingDate=&startDate=&endDate=&status=`
- `POST /api/hearings` (Protected) — Body: `{ case_id, hearing_date, hearing_time?, court_name?, judge_name?, hearing_type?, notes?, status? }`
- `GET /api/hearings/:id` (Protected)
- `PUT /api/hearings/:id` (Protected)
- `DELETE /api/hearings/:id` (Protected)

---

## 6. Documents (Private Supabase Storage)
- `GET /api/documents` (Protected) — Query: `?caseId=&category=`
- `POST /api/documents/upload` (Protected) — `multipart/form-data`: `file` (`.pdf`, `.docx`, `.txt`, max 25 MB), `case_id`, `document_name?`, `category?`
- `GET /api/documents/case/:caseId` (Protected)
- `GET /api/documents/:id` (Protected) — Returns metadata + short-lived signed URL
- `GET /api/documents/:id/download` (Protected) — Returns `{ downloadUrl, expiresIn, document }` (or streams file when `?stream=true`)
- `DELETE /api/documents/:id` (Protected)

---

## 7. Payments / Financial Records
- `GET /api/payments` (Protected) — Query: `?caseId=&status=`
- `POST /api/payments` (Protected) — Body: `{ case_id, total_fee, amount_paid?, payment_date?, payment_method?, status?, notes? }`
  - Automatically computes `pending_balance = total_fee - amount_paid`
  - Rejects `amount_paid > total_fee` (`400 OVERPAYMENT_NOT_ALLOWED`)
  - Rejects `status: "paid"` when `pending_balance > 0` (`400 OUTSTANDING_BALANCE_EXISTS`)
- `GET /api/payments/case/:caseId` (Protected) — Returns `{ caseId, summary: { totalFee, amountPaid, pendingBalance }, payments }`
- `PUT /api/payments/:id` (Protected)
- `DELETE /api/payments/:id` (Protected)

---

## 8. Dashboard
- `GET /api/dashboard` (Protected)
  Returns live calculated statistics from PostgreSQL:
  `totalClients`, `activeClients`, `totalCases`, `activeCases`, `pendingCases`, `closedCases`, `upcomingHearings`, `todaysHearings`, `totalAgreedFees`, `totalAmountCollected`, `outstandingBalance`, `todaysHearingsList`, `upcomingHearingsList`, `overduePaymentsList`, `caseDistribution`, `recentCases`, `recentActivities`.

---

## 9. AI Engine Integration & Advocate Review
- `GET /api/ai/health` (Protected) — Checks FastAPI AI Engine `/health`
- `POST /api/ai/agent-workflow` (Protected; alias `POST /api/ai/analyze`)
  Supports JSON or `multipart/form-data`:
  - `caseId` (UUID, required)
  - `documentId` or `documentIds` (UUID / UUID[], downloads actual files from Supabase Storage and forwards to `POST {AI_ENGINE_URL}/analyze`)
  - `files` (direct multipart upload, optional)
  - `documentText` (raw text forwarded to `POST {AI_ENGINE_URL}/analyze/text` when no files are selected)
  - `task` / `instruction` (optional advocate directive)
  - `additionalContext` (optional context)
- `GET /api/ai/analyses/case/:caseId` (Protected) — Lists saved AI analyses & advocate reviews for a case
- `GET /api/ai/analysis/:id` (Protected) — Fetches saved analysis & advocate review
- `POST /api/ai/analysis/:id/review` (Protected) — Body: `{ review_status, advocate_comments?, corrected_result?, reviewer_name? }`
- `POST /api/ai/analysis/:id/certify` (Protected) — Approves & certifies analysis (`review_status = 'approved'`, sets `certified_at`)

### AI Engine Response Mapping (`aiMapperService.js`)

| Counsel AI Engine (`CaseIntelligenceResult`) | Normalized Backend `data` Field | Notes |
|---|---|---|
| `document_analyst.case_title`, `matter_type`, `summary` | `summary: { caseTitle, matterType, text }` | Direct mapping |
| `document_analyst.parties` | `parties: [{ name, role }]` | Preserves extracted party names without inventing counsel |
| `document_analyst.facts` | `materialFacts: [{ id, fact, source }]` | Grounded facts linked to `processed_documents` |
| `document_analyst.claims_and_allegations` | `claimsAndAllegations` | Kept distinct from verified facts |
| `document_analyst.evidence_mentioned` | `evidence: [{ item }]` | Direct mapping |
| `document_analyst.payment_information` | `paymentInformation` | Direct mapping |
| `document_analyst.missing_documents` | `missingInformation: [{ item }]` | Direct mapping |
| `document_analyst.risks` | `strategyConsiderations: [{ title, detail }]` | Direct mapping |
| `document_analyst.advocate_questions` | `advocateQuestions` | Direct mapping |
| `timeline.chronological_events` | `timeline: [{ date, event, sourceDoc, pageNumber, isConflict, conflictNote }]` | Preserves page numbers & date conflict flags |
| `timeline.undated_events`, `date_conflicts` | `undatedEvents`, `dateConflicts` | Direct mapping |
| `actions.recommended_actions`, `immediate_next_steps` | `recommendedActions`, `immediateNextSteps` | Preserves priority, reason, missingEvidence, verification |
| `review` | `reviewFlags`, `confidence: { score, reviewPassed, groundingSummary }` | `null` if reviewer output omitted |
| `processed_documents` | `sourceReferences`, `processedDocuments` | Source traceability |

### Example Request & Response (`POST /api/ai/agent-workflow`)
Request:
```json
{
  "caseId": "550e8400-e29b-41d4-a716-446655440000",
  "documentIds": ["660e8400-e29b-41d4-a716-446655440001"],
  "task": "Extract material facts, timeline, and missing delivery proof"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "analysisId": "770e8400-e29b-41d4-a716-446655440002",
    "caseId": "550e8400-e29b-41d4-a716-446655440000",
    "summary": {
      "caseTitle": "Blue Oak Supplies vs Northstar Retail",
      "matterType": "Commercial Sale of Goods Dispute",
      "text": "Dispute concerning unpaid delivery of office furniture..."
    },
    "parties": [{ "name": "BLUE OAK SUPPLIES PRIVATE LIMITED", "role": "Named Party" }],
    "materialFacts": [{ "id": "F-01", "fact": "Agreement signed on 15 September 2026 for INR 80,000.", "source": "agreement_contract.txt" }],
    "timeline": [{ "date": "2026-09-15", "event": "Contract executed.", "sourceDoc": "agreement_contract.txt", "pageNumber": 1, "isConflict": false, "conflictNote": null }],
    "recommendedActions": [],
    "missingInformation": [{ "item": "Signed delivery challan or consignment note" }],
    "reviewFlags": [],
    "confidence": { "score": 0.98, "reviewPassed": true, "groundingSummary": "Strictly grounded in provided documents." },
    "sourceReferences": ["agreement_contract.txt"],
    "reviewStatus": "ai_generated"
  },
  "message": "Case analysis completed successfully"
}
```
