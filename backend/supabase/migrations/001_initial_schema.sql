-- ============================================================================
-- Counsel — Smart Advocate Office Management System
-- Initial PostgreSQL Schema, Constraints, Indexes, Triggers & RLS Policies
-- Target: Supabase PostgreSQL
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. ADVOCATE PROFILES (Linked to Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.advocate_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Advocate',
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Advocate',
  firm_name TEXT NOT NULL DEFAULT 'Counsel Chambers',
  bar_council_reg TEXT,
  office_address TEXT,
  jurisdiction TEXT,
  notification_prefs JSONB NOT NULL DEFAULT '{
    "hearingReminders": true,
    "paymentAlerts": true,
    "documentUploads": true,
    "weeklySummary": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_advocate_profiles_updated_at ON public.advocate_profiles;
CREATE TRIGGER trg_advocate_profiles_updated_at
  BEFORE UPDATE ON public.advocate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. CLIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_code TEXT,
  full_name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'Individual' CHECK (client_type IN ('Individual', 'Corporate')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON public.clients(full_name);

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. MATTERS / CASES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  title TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  case_type TEXT NOT NULL,
  court_name TEXT NOT NULL,
  judge_name TEXT,
  filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'disposed')),
  assigned_advocate TEXT,
  description TEXT,
  next_hearing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cases_user_case_number UNIQUE (user_id, case_number)
);

CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_next_hearing_date ON public.cases(next_hearing_date);

DROP TRIGGER IF EXISTS trg_cases_updated_at ON public.cases;
CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. HEARINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  hearing_date DATE NOT NULL,
  hearing_time TEXT NOT NULL DEFAULT '10:30',
  court_name TEXT NOT NULL,
  judge_name TEXT,
  hearing_type TEXT NOT NULL DEFAULT 'Hearing',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'today', 'completed', 'adjourned', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hearings_user_id ON public.hearings(user_id);
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON public.hearings(hearing_date);

DROP TRIGGER IF EXISTS trg_hearings_updated_at ON public.hearings;
CREATE TRIGGER trg_hearings_updated_at
  BEFORE UPDATE ON public.hearings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('PDF', 'DOCX', 'TXT')),
  category TEXT NOT NULL DEFAULT 'Court Filing',
  storage_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 6. PAYMENTS / FINANCIAL RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  total_fee NUMERIC(12, 2) NOT NULL CHECK (total_fee >= 0),
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0 AND amount_paid <= total_fee),
  pending_balance NUMERIC(12, 2) GENERATED ALWAYS AS (total_fee - amount_paid) STORED,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_payments_paid_balance CHECK (status <> 'paid' OR amount_paid = total_fee)
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_case_id ON public.payments(case_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. AI ANALYSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  document_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  task TEXT,
  structured_result JSONB,
  raw_ai_response JSONB,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON public.ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_case_id ON public.ai_analyses(case_id);

DROP TRIGGER IF EXISTS trg_ai_analyses_updated_at ON public.ai_analyses;
CREATE TRIGGER trg_ai_analyses_updated_at
  BEFORE UPDATE ON public.ai_analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 8. AI REVIEWS (Advocate Human-in-the-Loop Verification & Certification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL UNIQUE REFERENCES public.ai_analyses(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewer_name TEXT,
  corrected_result JSONB,
  review_status TEXT NOT NULL DEFAULT 'ai_generated' CHECK (review_status IN ('ai_generated', 'under_review', 'approved', 'rejected')),
  advocate_comments TEXT,
  certified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reviews_user_id ON public.ai_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_analysis_id ON public.ai_reviews(analysis_id);

DROP TRIGGER IF EXISTS trg_ai_reviews_updated_at ON public.ai_reviews;
CREATE TRIGGER trg_ai_reviews_updated_at
  BEFORE UPDATE ON public.ai_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.advocate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;

-- advocate_profiles policies
DROP POLICY IF EXISTS "Users manage own profile" ON public.advocate_profiles;
CREATE POLICY "Users manage own profile" ON public.advocate_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Helper macro style: explicit per-table policies scoped to auth.uid() = user_id
DROP POLICY IF EXISTS "Users manage own clients" ON public.clients;
CREATE POLICY "Users manage own clients" ON public.clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own cases" ON public.cases;
CREATE POLICY "Users manage own cases" ON public.cases
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own hearings" ON public.hearings;
CREATE POLICY "Users manage own hearings" ON public.hearings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own documents" ON public.documents;
CREATE POLICY "Users manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own payments" ON public.payments;
CREATE POLICY "Users manage own payments" ON public.payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own ai_analyses" ON public.ai_analyses;
CREATE POLICY "Users manage own ai_analyses" ON public.ai_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own ai_reviews" ON public.ai_reviews;
CREATE POLICY "Users manage own ai_reviews" ON public.ai_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. PRIVATE SUPABASE STORAGE BUCKET & STORAGE RLS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'counsel-documents',
  'counsel-documents',
  FALSE,
  26214400, -- 25 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 26214400;

DROP POLICY IF EXISTS "Users access own storage objects" ON storage.objects;
CREATE POLICY "Users access own storage objects" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'counsel-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'counsel-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
