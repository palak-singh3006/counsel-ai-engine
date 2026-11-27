# Counsel — Smart Advocate Office Management System ⚖️🤖

> **Full-Stack Legal Case Management & Multi-Agent Case Intelligence Platform**  
> Frontend: **React 19 + Vite + Lucide + Recharts**  
> AI Engine: **Python 3.12 + LangChain (LCEL) + Google Gemini + Pydantic + FastAPI**

---

## 📌 Project Overview

**Counsel** is an intelligent advocate office management system designed to streamline legal practice. It empowers legal professionals to manage clients, court hearings, legal matters, finances, and document discovery—while providing an automated **AI Case Intelligence Engine** that extracts verified facts, chronologically maps dispute timelines, highlights evidential gaps, and drafts prioritized preparation strategies for advocates.

---

## 🏗️ Repository Architecture

This repository is organized as a clean full-stack monorepo:

```text
counsel-ai-engine/
│
├── frontend/                     # React + Vite Client Application
│   ├── src/
│   │   ├── pages/                # Dashboard, Matters, Clients, Hearings, Documents, AIIntelligence
│   │   ├── components/           # Header, Sidebar, Modal, Toast, Reusable UI
│   │   ├── layout/               # Responsive AppLayout wrapper
│   │   ├── services/             # Axios API service connecting to backend/AI Engine
│   │   └── data/                 # Initial mock data and schemas
│   ├── public/                   # Static assets & icons
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite build configuration
│   └── README.md
│
├── ai-engine/                    # Python LangChain Multi-Agent AI Service
│   ├── app/
│   │   ├── agents/               # Specialized AI Agents (Analyst, Timeline, Action, Reviewer)
│   │   ├── document_processing/  # Multi-format loaders (PDF, DOCX, TXT) + Page tracking
│   │   ├── schemas/              # Pydantic v2 legal data contracts
│   │   ├── prompts/              # System prompts with legal grounding & anti-hallucination rules
│   │   ├── services/             # Gemini model factory & API configuration
│   │   ├── orchestrator.py       # Master pipeline orchestrator
│   │   └── main.py               # FastAPI REST service (GET /health, POST /analyze)
│   ├── sample_documents/         # Realistic fictional case documents for testing
│   ├── tests/                    # Offline automated unit tests
│   ├── demo.py                   # Master live CLI demo
│   ├── requirements.txt          # Python dependencies
│   ├── INTEGRATION.md            # Teammate backend integration manual
│   └── README.md
│
├── .gitignore                    # Comprehensive ignore rules (.env, .venv, node_modules)
└── README.md                     # Root project documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18+ or v20+)
- **Python** (v3.12+)
- **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/))

---

### 1. Running the AI Engine (Backend Service)

```bash
# Navigate to AI Engine folder
cd ai-engine

# Create & activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and insert your GEMINI_API_KEY

# Run automated offline unit tests (11 tests, zero API cost)
python -m unittest discover tests

# Run the live CLI Multi-Agent Demo
python demo.py

# Start the FastAPI server (Port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation: **`http://localhost:8000/docs`**

---

### 2. Running the Frontend (React UI)

```bash
# In a separate terminal, navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Open your browser to: **`http://localhost:5173`**

---

## 🤖 AI Multi-Agent Pipeline

```
[Case Files: PDF, DOCX, TXT] ──► [Document Loaders & OCR Check]
                                           │
                                           ▼
                                [Document Analyst Agent]
                                 • Confirmed Facts vs Allegations
                                 • Payment & Consideration Details
                                 • Missing Evidentiary Documents
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
               [Timeline Agent]                         [Action Agent]
               • Chronological Sorting                  • High/Med/Low Tasks
               • Date Conflict Detection                • Evidential Cures
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           ▼
                                   [Reviewer Agent]
                                   • Anti-Hallucination Audit
                                   • Grounding Score & Review Flags
                                           │
                                           ▼
                              [Unified CaseIntelligenceResult]
                                           │
                             ┌─────────────┴─────────────┐
                             ▼                           ▼
                     [FastAPI Endpoint]         [React Frontend UI]
```

| Agent | Responsibility | Output |
| :--- | :--- | :--- |
| **Document Loaders** | Ingests `.pdf`, `.docx`, `.txt`. Preserves page numbers and detects non-OCR scanned images. | `ProcessedDocument` |
| **Document Analyst** | Extracts matter title, category, parties, objective factual summary, explicit material facts, disputed allegations, and missing files. | `DocumentAnalystOutput` |
| **Timeline Agent** | Extracts and normalizes dates chronologically, flags conflicting dates, and isolates undated occurrences without inventing dates. | `TimelineOutput` |
| **Action Agent** | Suggests 3–5 strategic preparation tasks for the advocate with urgency priorities, legal rationale, and verification requirements. | `ActionAgentOutput` |
| **Reviewer Agent** | Audits outputs against source documents to prevent hallucinations, flag unsupported claims, and assign a grounding confidence score. | `ReviewerOutput` |
| **Master Orchestrator** | Coordinates all agents, handles partial failures gracefully, and outputs a validated Pydantic data structure. | `CaseIntelligenceResult` |

---

## 🌐 API Endpoints Reference

The AI Engine exposes a clean REST API for backend integration:

- **`GET /health`** — Health check verifying model status and engine availability.
- **`POST /analyze`** — Multi-file document analysis (`multipart/form-data`) supporting `.pdf`, `.docx`, and `.txt`.
- **`POST /analyze/text`** — Direct JSON analysis for raw case narratives or advocate interview notes.

*(See [ai-engine/INTEGRATION.md](file:///Users/palaksingh/Documents/counsel-ai/ai-engine/INTEGRATION.md) for full Axios and cURL integration snippets).*

---

## 🛡️ Legal Reliability & Safety Guardrails

- **Strict Factual Grounding:** All claims must be cited from provided documents; the engine never speculates.
- **Anti-Hallucination:** Never invents legal statutes, precedent cases, or court rulings.
- **Allegation vs. Fact Separation:** Clear boundaries between proven facts and unverified allegations.
- **Advocate-in-the-Loop:** Suggestions are designed for advocate review; no autonomous filings or communications are performed.

---

## 👥 Team Collaboration Workflow

```bash
# 1. Pull latest main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and verify
# For frontend:
cd frontend && npm run build
# For AI engine:
cd ai-engine && python -m unittest discover tests

# 4. Commit and push
git add .
git commit -m "feat: description of changes"
git push -u origin feature/your-feature-name

# 5. Open a Pull Request on GitHub
```

---

## 📄 License

Developed for the **Counsel** Hackathon Project. All rights reserved.
