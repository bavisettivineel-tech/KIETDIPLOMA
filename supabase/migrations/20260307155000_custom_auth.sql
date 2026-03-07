-- ============================================
-- KIET ERP: CUSTOM AUTH SYSTEM
-- system_users table (no email signup)
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  login_id TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'management', 'staff', 'faculty', 'student')),
  assigned_year TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow anon read for login verification (login page is unauthenticated)
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow login verification" ON public.system_users
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage users" ON public.system_users
  FOR ALL USING (true);

-- ============================================
-- SEED: Admin and Management accounts
-- ============================================
INSERT INTO public.system_users (name, login_id, password, role) VALUES
  ('Administrator', 'Kiet group',    'Kiet8297@',    'admin'),
  ('Management',    'Kiet Diploma',  'Diploma8297@', 'management')
ON CONFLICT (login_id) DO NOTHING;
