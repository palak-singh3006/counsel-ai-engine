# Counsel — Smart Advocate Office Management System ⚖️🤖

> **Full-Stack Legal Practice Management & Multi-Agent Case Intelligence Platform**
> Frontend: **React 19 + Vite + Lucide + Recharts** (`http://localhost:5173`)
> Main Backend: **Node.js + Express + Supabase (PostgreSQL, Auth, Private Storage)** (`http://localhost:5000`)
> AI Engine: **Python 3.12 + LangChain (LCEL) + Google Gemini + FastAPI** (`http://localhost:8000`)

---

## 🏗️ System Architecture

```text
counsel-ai-engine/
├── frontend/                     # React + Vite Client Application (Port 5173)
├── backend/                      # Express REST API + Supabase PostgreSQL/Storage/Auth (Port 5000)
│   ├── src/                      # Controllers, routes, validators, AI integration service
│   ├── supabase/migrations/      # Complete SQL schema, RLS policies & private bucket setup
│   ├── supabase/seed.js          # Demo advocate, clients, cases, hearings, payments & documents seed
│   ├── tests/                    # Automated backend & AI integration tests
│   └── API_DOCUMENTATION.md      # Full REST API & AI mapping contract
└── ai-engine/                    # Standalone Python Multi-Agent Gemini AI Service (Port 8000)
```

---

## ⚡ Complete Local Startup Guide

### 1. Start the Python AI Engine (Port 8000)
```bash
cd ai-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Insert your GEMINI_API_KEY in ai-engine/.env
python -m unittest discover tests
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Configure Supabase & Start the Main Backend (Port 5000)
1. In your Supabase Dashboard **SQL Editor**, run `backend/supabase/migrations/001_initial_schema.sql`.
2. Configure & run the backend:
```bash
cd backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, AI_ENGINE_URL=http://localhost:8000
npm run seed
npm test
npm run dev
```

### 3. Start the React Frontend (Port 5173)
```bash
cd frontend
npm install
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:5000/api
npm run dev
```

Open `http://localhost:5173` and sign in with your registered advocate credentials (or the demo account configured in `backend/.env` for `npm run seed`).

---

## 🌐 Service URLs & Documentation

- **Frontend App:** `http://localhost:5173`
- **Main Backend API:** `http://localhost:5000/api` (`GET /health`)
- **AI Engine FastAPI Docs:** `http://localhost:8000/docs` (`GET /health`, `POST /analyze`, `POST /analyze/text`)
- **Backend API Contract:** [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)
- **AI Engine Integration Guide:** [ai-engine/INTEGRATION.md](ai-engine/INTEGRATION.md)
