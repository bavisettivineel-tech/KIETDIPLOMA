
-- ============================================
-- KIET ERP DATABASE SCHEMA
-- ============================================

-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'management', 'staff', 'faculty', 'student');

-- ============================================
-- ACADEMIC YEARS
-- ============================================
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read academic_years" ON public.academic_years FOR SELECT TO authenticated USING (true);

-- ============================================
-- PROFILES (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ============================================
-- USER ROLES (separate table per security guidelines)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- STUDENTS
-- ============================================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  roll_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '1st Year',
  branch TEXT NOT NULL DEFAULT 'CME',
  phone TEXT,
  photo_url TEXT,
  admission_year INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_students_roll_number ON public.students(roll_number);
CREATE INDEX idx_students_academic_year ON public.students(academic_year);
CREATE INDEX idx_students_branch ON public.students(branch);

CREATE POLICY "Authenticated users can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/mgmt/faculty can insert students" ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Admin/mgmt/faculty can update students" ON public.students FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Admin can delete students" ON public.students FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FACULTY ASSIGNMENTS
-- ============================================
CREATE TABLE public.faculty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'CME',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read faculty_assignments" ON public.faculty_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage faculty_assignments" ON public.faculty_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ATTENDANCE
-- ============================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_roll ON public.attendance(roll_number);

CREATE POLICY "Authenticated can read attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Faculty/admin can insert attendance" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty/admin can update attendance" ON public.attendance FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));

-- ============================================
-- INTERNAL MARKS
-- ============================================
CREATE TABLE public.internal_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'General',
  mid1 NUMERIC(5,2),
  mid2 NUMERIC(5,2),
  mid3 NUMERIC(5,2),
  average NUMERIC(5,2) GENERATED ALWAYS AS (
    COALESCE(
      (COALESCE(mid1,0) + COALESCE(mid2,0) + COALESCE(mid3,0)) / 
      NULLIF((CASE WHEN mid1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN mid2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN mid3 IS NOT NULL THEN 1 ELSE 0 END), 0),
      0
    )
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject)
);
ALTER TABLE public.internal_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read internal_marks" ON public.internal_marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Faculty/admin can manage internal_marks" ON public.internal_marks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty/admin can update internal_marks" ON public.internal_marks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));

-- ============================================
-- ASSIGNMENT MARKS
-- ============================================
CREATE TABLE public.assignment_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'General',
  assignment1 NUMERIC(5,2),
  assignment2 NUMERIC(5,2),
  assignment3 NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject)
);
ALTER TABLE public.assignment_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read assignment_marks" ON public.assignment_marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Faculty/admin can manage assignment_marks" ON public.assignment_marks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty/admin can update assignment_marks" ON public.assignment_marks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));

-- ============================================
-- FEES
-- ============================================
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tuition NUMERIC(10,2) NOT NULL DEFAULT 25000,
  exam_fee NUMERIC(10,2) NOT NULL DEFAULT 3000,
  other_fee NUMERIC(10,2) NOT NULL DEFAULT 2000,
  total NUMERIC(10,2) GENERATED ALWAYS AS (tuition + exam_fee + other_fee) STORED,
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year)
);
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read fees" ON public.fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/mgmt can manage fees" ON public.fees FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management'));
CREATE POLICY "Admin/mgmt can update fees" ON public.fees FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management'));

-- ============================================
-- FEE PAYMENTS
-- ============================================
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  receipt_number TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read fee_payments" ON public.fee_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/mgmt can manage fee_payments" ON public.fee_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management'));

-- ============================================
-- TRANSPORT REGISTRATIONS
-- ============================================
CREATE TABLE public.transport_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  pickup_point TEXT NOT NULL,
  transport_fee NUMERIC(10,2) NOT NULL DEFAULT 5000,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year)
);
ALTER TABLE public.transport_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read transport" ON public.transport_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/mgmt can manage transport" ON public.transport_registrations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management'));
CREATE POLICY "Admin/mgmt can update transport" ON public.transport_registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management'));

-- ============================================
-- NOTICES
-- ============================================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  posted_by UUID REFERENCES auth.users(id),
  posted_by_name TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read notices" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/mgmt/faculty can post notices" ON public.notices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'management') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Admin can manage notices" ON public.notices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR posted_by = auth.uid());
CREATE POLICY "Admin can delete notices" ON public.notices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR posted_by = auth.uid());

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internal_marks_updated_at BEFORE UPDATE ON public.internal_marks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignment_marks_updated_at BEFORE UPDATE ON public.assignment_marks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true);

CREATE POLICY "Anyone can view student photos" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Authenticated users can upload student photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Authenticated users can update student photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'student-photos');

-- ============================================
-- SEED ACADEMIC YEARS
-- ============================================
INSERT INTO public.academic_years (name) VALUES ('1st Year'), ('2nd Year'), ('3rd Year');
