-- STEP 2: Create Just Sessions Table
-- If step 1 works, try this

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SET search_path = public, pg_catalog;

-- Create ONLY the sessions table
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Service role can manage all sessions" ON public.sessions 
FOR ALL TO service_role USING (true);

-- Grant permissions
GRANT ALL ON public.sessions TO service_role;

-- Verify table exists
SELECT 'sessions table created successfully!' as result;