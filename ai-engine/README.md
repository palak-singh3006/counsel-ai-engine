# Counsel — AI Case Intelligence Engine ⚖️🤖

> **Intelligent Legal Document Analysis & Multi-Agent Case Preparation Service**  
> Built with **Python 3.12**, **LangChain (LCEL)**, **Google Gemini**, **Pydantic**, and **FastAPI** for **Counsel — Smart Advocate Office Management System**.

---

## 📌 Project Overview

**Counsel** is a legal office management platform designed to help advocates analyze case materials, understand facts, organize chronological timelines, detect gaps in evidence, and prepare for hearings more efficiently.

This repository contains the standalone **AI Engine**, responsible for:
- Ingesting multi-format legal documents (**PDF**, **DOCX**, **TXT**) with page tracking.
- Detecting scanned PDFs without digital text layers (OCR alerts).
- Parsing case facts, claims, allegations, and payment records via the **Document Analyst Agent**.
- Assembling and reconciling dates via the **Timeline Agent**.
- Generating prioritized case preparation steps via the **Action Agent**.
- Auditing outputs for hallucinations and evidential gaps via the **Reviewer Agent**.
- Serving structured JSON results to the main backend and React frontend via a high-performance **FastAPI REST API**.

---

## 🏗️ Multi-Agent Architecture

```
                      [Case Documents: .pdf, .docx, .txt]
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ Document Processing Layer │
                        │  (Loaders, OCR, Chunking) │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Document Analyst Agent  │
                        │ (Facts, Claims, Evidence) │
                        └──────┬─────────────┬──────┘
                               │             │
                 ┌─────────────┘             └─────────────┐
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │       Timeline Agent      │             │        Action Agent       │
   │  (Chronological Events &  │             │   (Strategic Next Steps & │
   │      Date Conflicts)      │             │    Evidence Requirements) │
   └─────────────┬─────────────┘             └─────────────┬─────────────┘
                 │                                         │
                 └─────────────────────┬───────────────────┘
                                       ▼
                        ┌───────────────────────────┐
                        │       Reviewer Agent      │
                        │ (Grounding Audit & Flags) │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    Master Orchestrator    │
                        │   (Pydantic Synthesis)    │
                        └─────────────┬─────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
     [CLI Demo: python demo.py]              [FastAPI: POST /analyze]
                                                           │
                                                           ▼
                                                [Main Backend & Database]
                                                           │
                                                           ▼
                                                [React + Vite Frontend]
```

---

## 🤖 AI Agents & Responsibilities

| Agent | Responsibility | Output Schema |
| :--- | :--- | :--- |
| **Document Loaders** | Ingests `.pdf`, `.docx`, `.txt`. Preserves page numbers and identifies empty/scanned files. | `ProcessedDocument` |
| **Document Analyst** | Extracts matter title, category, parties, objective factual summary, explicit material facts, disputed allegations, evidence mentioned, payment figures, and advocate interview questions. | `DocumentAnalystOutput` |
| **Timeline Agent** | Extracts and normalizes dates in chronological order, identifies conflicting dates, and flags undated events. | `TimelineOutput` |
| **Action Agent** | Suggests 3–5 strategic preparation tasks for the advocate with urgency priorities (`High`, `Medium`, `Low`), legal rationale, and verification requirements. | `ActionAgentOutput` |
| **Reviewer Agent** | Audits agent outputs against original source documents to prevent hallucinations, flag unsupported claims, and assign a grounding confidence score. | `ReviewerOutput` |
| **Master Orchestrator** | Coordinates execution across all agents, handles partial failures gracefully, and synthesizes results into a single validated data structure. | `CaseIntelligenceResult` |

---

## 🛠️ Technology Stack

- **Language:** Python 3.12+
- **LLM Orchestration:** LangChain (LCEL) & `langchain-google-genai`
- **Model:** Google Gemini (`gemini-3.5-flash-lite` — fast, cost-effective, free-tier supported)
- **Data Validation:** Pydantic v2
- **API Framework:** FastAPI & Uvicorn
- **Document Extractors:** `pypdf`, `python-docx`
- **Configuration:** `python-dotenv`

---

## 📁 Repository Structure

```text
counsel-ai-engine/
├── app/
│   ├── __init__.py
│   ├── config.py                 # Environment configuration & API key validation
│   ├── main.py                   # FastAPI REST API endpoints
│   ├── orchestrator.py           # Master Multi-Agent Orchestrator
│   ├── services/
│   │   └── llm_service.py        # Central Gemini model factory
│   ├── schemas/
│   │   └── legal_schemas.py      # Strongly-typed Pydantic data contracts
│   ├── document_processing/
│   │   ├── loaders.py            # PDF, DOCX, TXT loaders + Scanned detection
│   │   └── chunking.py           # Metadata-preserving chunker
│   ├── prompts/
│   │   └── legal_prompts.py      # Reusable legal prompt templates
│   ├── agents/
│   │   ├── document_analyst.py   # Document Analyst implementation
│   │   ├── timeline_agent.py     # Timeline Agent implementation
│   │   ├── action_agent.py       # Action Agent implementation
│   │   └── reviewer_agent.py     # Reviewer Agent implementation
│   └── chains/
│       └── case_analysis_chain.py# Single-prompt case analysis chain
├── sample_documents/             # Realistic fictional legal documents
│   ├── agreement_contract.txt
│   ├── delivery_claim_notice.txt
│   └── informal_dispute_email.txt
├── tests/
│   ├── test_schemas.py           # Offline Pydantic schema validation tests
│   ├── test_loaders.py           # Offline document loading & chunking tests
│   └── test_api.py               # Offline FastAPI endpoint tests
├── demo.py                       # Master hackathon demo runner
├── INTEGRATION.md                 # Teammate backend integration guide
├── PROGRESS.md                   # Project completion & verification log
├── requirements.txt              # Pinned Python dependencies
├── .env.example                  # Environment template
└── .gitignore                    # Excludes .env, .venv, and bytecode
```

---

## 🚀 Setup & Installation (macOS)

### 1. Clone the Repository
```bash
git clone https://github.com/palak-singh3006/counsel-ai-engine.git
cd counsel-ai-engine
```

### 2. Create and Activate Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open [.env](file:///Users/palaksingh/Documents/counsel-ai/.env) and insert your Google Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-3.5-flash-lite"
```
*(Get a free key at [Google AI Studio](https://aistudio.google.com/)).*

---

## 🧪 Running Tests & Demos

### A. Run Offline Unit Tests (Instant, No API Quota Used)
```bash
python -m unittest discover tests
```
Runs 11 automated unit tests verifying schema constraints, document parsing, chunking, and FastAPI route handling.

### B. Run the Master Live Demo
```bash
python demo.py
```
Executes the live multi-agent workflow on fictional legal dispute files (`Blue Oak Supplies v. Northstar Retail`) using Google Gemini and prints the full synthesized intelligence report.

---

## 🌐 Running the FastAPI REST Service

Start the local API server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger documentation will be available at:
👉 **`http://localhost:8000/docs`**

### API Endpoints:

#### 1. `GET /health`
Verifies AI Engine status and active model.
```json
{
  "status": "healthy",
  "service": "Counsel AI Engine",
  "model": "gemini-3.5-flash-lite",
  "engine_version": "1.0.0"
}
```

#### 2. `POST /analyze` (Multi-File Upload)
Accepts one or more `.pdf`, `.docx`, or `.txt` files via `multipart/form-data`.
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "case_id=MATTER-2026-BOS089" \
  -F "matter_title=Blue Oak Supplies v. Northstar Retail" \
  -F "files=@sample_documents/agreement_contract.txt" \
  -F "files=@sample_documents/delivery_claim_notice.txt" \
  -F "files=@sample_documents/informal_dispute_email.txt"
```

#### 3. `POST /analyze/text` (Direct Text Input)
Accepts raw case narrative JSON for instant analysis.
```bash
curl -X POST "http://localhost:8000/analyze/text" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "MATTER-101",
    "matter_title": "Contract Claim",
    "case_text": "Supplier Blue Oak agreed to deliver equipment for Rs 80,000..."
  }'
```

*For complete backend integration code snippets (Node.js/Axios and Python), see [INTEGRATION.md](file:///Users/palaksingh/Documents/counsel-ai/INTEGRATION.md).*

---

## 🛡️ Legal Safety & Anti-Hallucination Guardrails

Counsel is designed strictly as a legal-support system for advocates:
1. **Strict Factual Grounding:** Agents are instructed to extract only facts directly present in the source text.
2. **No Fabricated Citations:** Never invents legal statutes, precedent cases, or court rulings.
3. **Allegation vs. Fact Separation:** Clearly labels unproven statements as claims rather than established truths.
4. **Mandatory Human-in-the-Loop:** All action recommendations require advocate verification before taking any legal action. No autonomous filing or communication is performed.

---

## 👥 Git Collaboration & Team Workflow

1. **Pull Latest Changes:**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create Feature Branch:**
   ```bash
   git checkout -b feature/agent-enhancement
   ```
3. **Commit & Push:**
   ```bash
   git add .
   git commit -m "feat: add citation page linking"
   git push -u origin feature/agent-enhancement
   ```
4. **Merge via Pull Request:** Open a PR on GitHub, ensure tests pass (`python -m unittest discover tests`), and merge into `main`.

---

## 📄 License

Developed for the **Counsel** Hackathon Project. All rights reserved.
