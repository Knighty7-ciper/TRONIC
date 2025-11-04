-- QUICK FIX: Just create sessions table
-- Run this first to fix the immediate error

-- Step 1: Enable required extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Set search path
SET search_path = public, pg_catalog;

-- Step 3: Create sessions table with proper schema qualification
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create CORRECTED policy (NOT auth.role())
CREATE POLICY "Service role can manage all sessions" ON public.sessions 
FOR ALL TO service_role USING (true);

-- Step 6: Grant permissions
GRANT ALL ON public.sessions TO service_role;

-- Verify it worked
SELECT 'Sessions table created successfully!' as result;