# Counsel AI Engine — Backend Integration Guide

This guide enables the main backend engineer to integrate the **Counsel AI Engine** with the main database and backend service.

---

## 1. Quick Start: Running the AI Service

From the `counsel-ai` directory:

```bash
# 1. Activate the Python virtual environment
source .venv/bin/activate

# 2. Start the FastAPI server (default port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation (Swagger UI) is available at:
`http://localhost:8000/docs`

---

## 2. API Endpoints

### A. Health Check
- **Endpoint:** `GET /health`
- **Response:**
```json
{
  "status": "healthy",
  "service": "Counsel AI Engine",
  "model": "gemini-3.5-flash-lite",
  "engine_version": "1.0.0"
}
```

---

### B. Multi-File Document Analysis (Recommended)
Analyze one or more legal case documents (`.pdf`, `.docx`, `.txt`).

- **Endpoint:** `POST /analyze`
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `files`: One or more binary files (`.pdf`, `.docx`, `.txt`) (Required)
  - `case_id`: String ID of the matter in your database (e.g. `"MATTER-1042"`) (Optional)
  - `matter_title`: Human-readable title of the case (Optional)

#### Example using `cURL`:
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "case_id=MATTER-1042" \
  -F "matter_title=Blue Oak Supplies v. Northstar Retail" \
  -F "files=@sample_documents/agreement_contract.txt" \
  -F "files=@sample_documents/delivery_claim_notice.txt"
```

#### Example using Node.js / Axios (Backend Integration):
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function analyzeCaseDocuments(caseId, title, filePaths) {
  const form = new FormData();
  form.append('case_id', caseId);
  form.append('matter_title', title);
  
  for (const path of filePaths) {
    form.append('files', fs.createReadStream(path));
  }

  const response = await axios.post('http://localhost:8000/analyze', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data; // Fully typed CaseIntelligenceResult JSON
}
```

---

### C. Direct Text Analysis
Useful when the backend already has case text or advocate notes extracted in memory.

- **Endpoint:** `POST /analyze/text`
- **Content-Type:** `application/json`
- **Payload:**
```json
{
  "case_id": "MATTER-1042",
  "matter_title": "Blue Oak Supplies v. Northstar Retail",
  "case_text": "Supplier Blue Oak agreed to deliver office equipment for Rs 80,000..."
}
```

---

## 3. Standard Response Structure (`CaseIntelligenceResult`)

Every analysis returns a clean, validated JSON structure ready to be stored in the database or forwarded to the React frontend:

```json
{
  "case_id": "MATTER-2026-BOS089",
  "matter_title": "Blue Oak Supplies v. Northstar Retail",
  "processed_documents": [
    "agreement_contract.txt",
    "delivery_claim_notice.txt",
    "informal_dispute_email.txt"
  ],
  "document_analyst": {
    "case_title": "Blue Oak Supplies vs Northstar Retail",
    "matter_type": "Commercial Sale of Goods Dispute",
    "parties": ["BLUE OAK SUPPLIES PRIVATE LIMITED", "NORTHSTAR RETAIL VENTURES"],
    "summary": "Dispute concerning unpaid delivery of office furniture...",
    "facts": [
      "Agreement signed on 15 September 2026 for INR 80,000.",
      "Delivery claimed on 10 October 2026."
    ],
    "claims_and_allegations": [
      "Northstar claims shortage of 8 chairs and 2 damaged desks."
    ],
    "payment_information": [
      "Total contract price: INR 80,000",
      "Payment terms: Within 15 days of verified delivery"
    ],
    "missing_documents": [
      "Signed delivery challan or consignment note"
    ],
    "risks": [
      "Lack of signed delivery proof to defeat missing goods defense"
    ],
    "advocate_questions": [
      "Does the client have vehicle GPS or gate pass logs for 10 October?"
    ]
  },
  "timeline": {
    "chronological_events": [
      {
        "date": "2026-09-15",
        "event_description": "Contract executed.",
        "source_doc": "agreement_contract.txt",
        "page_number": 1,
        "is_conflict": false,
        "conflict_note": null
      },
      {
        "date": "2026-10-10",
        "event_description": "Goods delivered / shortage disputed.",
        "source_doc": "informal_dispute_email.txt",
        "page_number": 1,
        "is_conflict": true,
        "conflict_note": "Conflicting claims over completeness of delivery."
      }
    ],
    "undated_events": [],
    "date_conflicts": [
      "Delivery content contested between supplier and buyer accounts."
    ]
  },
  "actions": {
    "recommended_actions": [
      {
        "title": "Investigate Delivery Challan Status",
        "explanation": "Collect dispatch registers and determine why no signed challan was taken.",
        "priority": "High",
        "reason": "Payment clause requires verified delivery receipt.",
        "missing_evidence": "Signed delivery receipt",
        "advocate_verification_needed": "Verify driver testimony"
      }
    ],
    "immediate_next_steps": [
      "Investigate Delivery Challan Status",
      "Obtain Transport and Dispatch Logs"
    ]
  },
  "review": {
    "review_passed": true,
    "confidence_score": 0.98,
    "flags": [
      {
        "severity": "Caution",
        "issue_type": "Evidentiary Gap",
        "description": "Delivery driver left without signed receipt.",
        "recommendation": "Demand transport consignment proof."
      }
    ],
    "grounding_summary": "Strictly grounded in provided documents."
  },
  "pipeline_status": {
    "document_analyst": "success",
    "timeline_agent": "success",
    "action_agent": "success",
    "reviewer_agent": "success"
  }
}
```

---

## 4. Frontend Component Mapping

| Frontend UI Section | Backend JSON Field |
| :--- | :--- |
| **Case Overview Banner** | `matter_title`, `document_analyst.matter_type`, `document_analyst.parties` |
| **Executive Summary Tab** | `document_analyst.summary` |
| **Facts & Claims Tab** | `document_analyst.facts`, `document_analyst.claims_and_allegations` |
| **Timeline View** | `timeline.chronological_events` (mapped to vertical timeline) |
| **Evidentiary Gaps** | `document_analyst.missing_documents` |
| **Advocate Action Plan** | `actions.recommended_actions` (with `priority` badges) |
| **Reviewer Sanity Check** | `review.confidence_score`, `review.flags` |
