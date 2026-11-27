-- ============================================================================
-- Counsel — SQL Reference Seed Template
-- NOTE: Because tables have foreign keys to auth.users(id), the recommended
-- way to seed demo data is `npm run seed` (backend/supabase/seed.js), which
-- creates the demo auth user via Supabase Auth Admin API and populates all
-- related clients, cases, hearings, payments, and sample storage documents.
--
-- If you want to run raw SQL directly in Supabase SQL Editor, replace
-- :USER_ID below with an existing UUID from `SELECT id FROM auth.users LIMIT 1;`
-- ============================================================================

-- Example (replace '<YOUR_AUTH_USER_UUID>' before running):
/*
DO $$
DECLARE
  v_user_id UUID := '<YOUR_AUTH_USER_UUID>';
  v_client_1 UUID := gen_random_uuid();
  v_client_2 UUID := gen_random_uuid();
  v_case_1 UUID := gen_random_uuid();
  v_case_2 UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.clients (id, user_id, client_code, full_name, client_type, phone, email, address, status)
  VALUES
    (v_client_1, v_user_id, 'CL001', 'Rajesh Kumar Verma', 'Individual', '+91 98765 43210', 'rajesh.verma.demo@example.com', 'A-12, Sector 62, Noida', 'active'),
    (v_client_2, v_user_id, 'CL002', 'Blue Oak Supplies Pvt. Ltd.', 'Corporate', '+91 11 2345 6789', 'legal@blueoaksupplies.example.com', 'DLF Cyber Hub, Gurugram', 'active');

  INSERT INTO public.cases (id, user_id, case_number, title, client_id, case_type, court_name, filing_date, status, assigned_advocate, description, next_hearing_date)
  VALUES
    (v_case_1, v_user_id, 'CS/2026/001', 'Verma vs. State of UP', v_client_1, 'Criminal', 'High Court, Lucknow', CURRENT_DATE - 90, 'active', 'Advocate J.K. Shukla', 'Criminal appeal u/s 374(2) CrPC', CURRENT_DATE),
    (v_case_2, v_user_id, 'CS/2026/003', 'Blue Oak Supplies vs. Northstar Retail', v_client_2, 'Commercial', 'Commercial Court, Delhi', CURRENT_DATE - 45, 'active', 'Advocate J.K. Shukla', 'Commercial recovery suit under supply agreement', CURRENT_DATE + 5);

  INSERT INTO public.hearings (user_id, case_id, hearing_date, hearing_time, court_name, judge_name, hearing_type, status, notes)
  VALUES
    (v_user_id, v_case_1, CURRENT_DATE, '10:30', 'High Court, Lucknow', 'Hon. Justice A.K. Singh', 'Arguments', 'today', 'Arguments on suspension of sentence'),
    (v_user_id, v_case_2, CURRENT_DATE + 5, '14:00', 'Commercial Court, Delhi', 'Hon. District Judge V. Mehta', 'Admission', 'upcoming', 'Inspection of delivery claim notice');

  INSERT INTO public.payments (user_id, case_id, total_fee, amount_paid, payment_date, payment_method, status, notes)
  VALUES
    (v_user_id, v_case_1, 150000, 150000, CURRENT_DATE - 60, 'Bank Transfer', 'paid', 'Initial appellate retainer'),
    (v_user_id, v_case_2, 250000, 150000, CURRENT_DATE - 20, 'Bank Transfer', 'partial', 'Commercial suit retainer — partial payment');
END $$;
*/
