-- SUPABASE DATABASE SETUP INSTRUCTIONS
-- Copy and paste this script into your Supabase SQL Editor to create the necessary tables.

CREATE TABLE public.students (
    -- The user requested interHallTicket to basically act as the primary unique key
    -- Here we define a UUID primary key but ensure interHallTicket is Unique
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    branch TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    
    -- Documents is stored as a structured JSONB object
    documents JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status of Verification
    status TEXT NOT NULL CHECK (status IN ('Unverified', 'Pending', 'Verified')) DEFAULT 'Unverified',
    
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow completely public access for this ERP app context since we use the Service Role Key on the backend
-- Note: If you connect directly from the frontend using ANON key, you would need appropriate policies.
-- Since this architecture routes through the Express backend with Service Role, RLS policies here are bypassed automatically.
CREATE POLICY "Enable read access for all users" ON public.students AS PERMISSIVE FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.students AS PERMISSIVE FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.students AS PERMISSIVE FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.audit_logs AS PERMISSIVE FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.audit_logs AS PERMISSIVE FOR INSERT WITH CHECK (true);
