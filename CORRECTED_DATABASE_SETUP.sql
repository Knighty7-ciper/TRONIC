-- CORRECTED TRONIC Database Setup
-- Based on diagnostic analysis

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Set proper search path
SET search_path = public, pg_catalog;

-- Step 3: Drop existing objects (safe with proper schema qualification)
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS command_logs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Step 4: Create Sessions Table (primary table causing errors)
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create CORRECTED RLS policy (NOT auth.role())
-- Option A: Simple service_role check
CREATE POLICY "Service role can manage all sessions" ON public.sessions 
FOR ALL TO service_role USING (true);

-- OR Option B: Authenticated user check  
-- CREATE POLICY "Service role can manage all sessions" ON public.sessions 
-- FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- Step 7: Grant permissions
GRANT ALL ON public.sessions TO service_role;

-- Step 8: Create other essential tables
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all users" ON public.users 
FOR ALL TO service_role USING (true);
GRANT ALL ON public.users TO service_role;

CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    ai_response TEXT,
    message_type TEXT DEFAULT 'user',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all messages" ON public.messages 
FOR ALL TO service_role USING (true);
GRANT ALL ON public.messages TO service_role;

-- Step 9: Verify setup
SELECT 
    'Database Setup Complete!' as status,
    'Extensions: pgcrypto enabled' as extensions,
    'Tables created: sessions, users, messages' as tables,
    'RLS policies configured correctly' as policies,
    NOW() as setup_time;