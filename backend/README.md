# Counsel Main Backend (Node.js + Express + Supabase)

Main REST backend for **Counsel — Smart Advocate Office Management System**. Connects the React frontend to Supabase PostgreSQL, Supabase Auth, private Supabase Storage, and the standalone Python **Counsel AI Engine** (`../ai-engine`).

## Architecture

```text
backend/
├── src/
│   ├── config/        # Environment & Supabase client factories
│   ├── controllers/   # Route handlers (Auth, Clients, Cases, Hearings, Docs, Payments, Dashboard, AI)
│   ├── middleware/    # JWT verification, Zod validation, Multer file upload guard, centralized error handler
│   ├── routes/        # Modular Express routers
│   ├── services/      # AI Engine HTTP client, AI response mapper, Supabase private storage service
│   ├── utils/         # Standard JSON responses, async wrapper, logger
│   ├── validators/    # Zod request schemas
│   ├── app.js         # Express app factory
│   └── server.js      # HTTP entrypoint
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   ├── seed.js
│   └── seed.sql
├── tests/api.test.js
├── .env.example
└── API_DOCUMENTATION.md
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Supabase
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase dashboard and run the complete migration script:
   `backend/supabase/migrations/001_initial_schema.sql`
   This creates all tables (`advocate_profiles`, `clients`, `cases`, `hearings`, `documents`, `payments`, `ai_analyses`, `ai_reviews`), constraints, triggers, RLS policies, and the private `counsel-documents` Storage bucket.

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Fill in:
- `PORT=5000`
- `FRONTEND_URL=http://localhost:5173`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (kept strictly on backend; never exposed to frontend)
- `SUPABASE_STORAGE_BUCKET=counsel-documents`
- `AI_ENGINE_URL=http://localhost:8000`
- `AI_ENGINE_TIMEOUT=120000`

### 4. Seed Realistic Demo Records
```bash
npm run seed
```
Creates a demo advocate user (`SEED_ADVOCATE_EMAIL` / `SEED_ADVOCATE_PASSWORD`), fictional clients, legal cases, hearings, partial/completed payment records, and uploads sample legal documents into private Supabase Storage.

### 5. Run the Server
```bash
# Development
npm run dev

# Production
npm start
```
Verify health: `curl http://localhost:5000/health`

### 6. Run Backend Tests
```bash
npm test
```

## Deployment Notes
- Deploy `ai-engine`, `backend`, and `frontend` as three independent services.
- Set `AI_ENGINE_URL` in the backend host environment to the deployed AI Engine HTTPS URL.
- Set `FRONTEND_URL` to your deployed frontend origin(s) (comma-separated if multiple).
- Set `VITE_API_URL` in the frontend build environment to `https://<your-backend-domain>/api`.
