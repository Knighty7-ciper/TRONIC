-- ================================================================
-- TRONIC PLATFORM - DATABASE SETUP (SYNTAX ERROR FIXED)
-- Fixed DROP INDEX syntax - no "ON" keyword needed
-- ================================================================

-- STEP 1: ENABLE REQUIRED EXTENSIONS (CRITICAL - MUST BE FIRST)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- STEP 2: SET PROPER SEARCH PATH
SET search_path = public, pg_catalog;

-- STEP 3: CLEAN SLATE - DROP ALL EXISTING OBJECTS (CORRECTED)

-- Drop triggers first
DROP TRIGGER IF EXISTS update_command_logs_updated_at ON public.command_logs;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;

-- Drop functions (with proper signatures)
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_system_overview();
DROP FUNCTION IF EXISTS get_user_stats(UUID);
DROP FUNCTION IF EXISTS log_user_activity(UUID, TEXT, JSONB, TEXT, UUID, INET, TEXT);

-- Drop policies (with schema qualification)
DROP POLICY IF EXISTS "Service role can manage all user activity" ON public.user_activity;
DROP POLICY IF EXISTS "Service role can manage all system metrics" ON public.system_metrics;
DROP POLICY IF EXISTS "Service role can manage all command logs" ON public.command_logs;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.sessions;

-- Drop indexes (CORRECTED - NO "ON" KEYWORD)
DROP INDEX IF EXISTS idx_system_metrics_created_at;
DROP INDEX IF EXISTS idx_system_metrics_name;
DROP INDEX IF EXISTS idx_user_activity_created_at;
DROP INDEX IF EXISTS idx_user_activity_resource_type;
DROP INDEX IF EXISTS idx_user_activity_action;
DROP INDEX IF EXISTS idx_user_activity_user_id;
DROP INDEX IF EXISTS idx_command_logs_created_at;
DROP INDEX IF EXISTS idx_command_logs_status;
DROP INDEX IF EXISTS idx_command_logs_user_id;
DROP INDEX IF EXISTS idx_messages_message_type;
DROP INDEX IF EXISTS idx_messages_timestamp;
DROP INDEX IF EXISTS idx_messages_user_id;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_sessions_expires_at;
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_token;

-- Drop tables (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS public.user_activity CASCADE;
DROP TABLE IF EXISTS public.system_metrics CASCADE;
DROP TABLE IF EXISTS public.command_logs CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;

-- STEP 4: CREATE CORE TABLES (in dependency order)

-- Sessions table (no dependencies)
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (references auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (references auth.users)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    ai_response TEXT,
    message_type TEXT DEFAULT 'user',
    context JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Command logs table (references auth.users)
CREATE TABLE public.command_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    arguments TEXT,
    output TEXT,
    error_message TEXT,
    status TEXT DEFAULT 'pending',
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System metrics table (standalone)
CREATE TABLE public.system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    value JSONB NOT NULL,
    tags JSONB DEFAULT '{}',
    source TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity table (references auth.users)
CREATE TABLE public.user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- STEP 6: CREATE CORRECTED RLS POLICIES
-- Using TO service_role USING (true) instead of auth.role()

-- Sessions policies
CREATE POLICY "Service role can manage all sessions" ON public.sessions 
FOR ALL TO service_role USING (true);

-- Users policies
CREATE POLICY "Service role can manage all users" ON public.users 
FOR ALL TO service_role USING (true);

-- Messages policies
CREATE POLICY "Service role can manage all messages" ON public.messages 
FOR ALL TO service_role USING (true);

-- Command logs policies
CREATE POLICY "Service role can manage all command logs" ON public.command_logs 
FOR ALL TO service_role USING (true);

-- System metrics policies
CREATE POLICY "Service role can manage all system metrics" ON public.system_metrics 
FOR ALL TO service_role USING (true);

-- User activity policies
CREATE POLICY "Service role can manage all user activity" ON public.user_activity 
FOR ALL TO service_role USING (true);

-- STEP 7: CREATE TRIGGER FUNCTIONS AND TRIGGERS

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON public.sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_command_logs_updated_at 
    BEFORE UPDATE ON public.command_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 8: CREATE INDEXES FOR PERFORMANCE

-- Session indexes
CREATE INDEX idx_sessions_token ON public.sessions(token);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);

-- User indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Message indexes
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX idx_messages_message_type ON public.messages(message_type);

-- Command log indexes
CREATE INDEX idx_command_logs_user_id ON public.command_logs(user_id);
CREATE INDEX idx_command_logs_status ON public.command_logs(status);
CREATE INDEX idx_command_logs_created_at ON public.command_logs(created_at DESC);

-- User activity indexes
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_action ON public.user_activity(action);
CREATE INDEX idx_user_activity_resource_type ON public.user_activity(resource_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- System metrics indexes
CREATE INDEX idx_system_metrics_name ON public.system_metrics(metric_name);
CREATE INDEX idx_system_metrics_created_at ON public.system_metrics(created_at DESC);

-- STEP 9: CREATE FUNCTIONS

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO public.user_activity (
        user_id, action, details, resource_type, resource_id, 
        ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_details, p_resource_type, p_resource_id,
        p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_messages INTEGER;
    total_commands INTEGER;
    last_activity TIMESTAMPTZ;
    avg_response_time DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_messages 
    FROM public.messages WHERE user_id = user_uuid;
    
    SELECT COUNT(*) INTO total_commands 
    FROM public.command_logs WHERE user_id = user_uuid;
    
    SELECT MAX(created_at) INTO last_activity 
    FROM public.user_activity WHERE user_id = user_uuid;
    
    SELECT COALESCE(AVG(execution_time_ms), 0) INTO avg_response_time 
    FROM public.command_logs 
    WHERE user_id = user_uuid AND status = 'completed' AND execution_time_ms IS NOT NULL;
    
    SELECT json_build_object(
        'total_messages', total_messages,
        'total_commands', total_commands,
        'last_activity', last_activity,
        'avg_response_time', ROUND(avg_response_time, 2),
        'stats_generated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system overview
CREATE OR REPLACE FUNCTION get_system_overview()
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_users INTEGER;
    total_messages INTEGER;
    total_commands INTEGER;
    recent_activity_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_messages FROM public.messages;
    SELECT COUNT(*) INTO total_commands FROM public.command_logs;
    
    SELECT COUNT(*) INTO recent_activity_count 
    FROM public.user_activity 
    WHERE created_at > NOW() - INTERVAL '24 hours';
    
    SELECT json_build_object(
        'total_users', total_users,
        'total_messages', total_messages,
        'total_commands', total_commands,
        'recent_activity_24h', recent_activity_count,
        'generated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: GRANT PERMISSIONS

-- Grant schema access
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- STEP 11: SUCCESS VERIFICATION
SELECT 
    '✅ TRONIC DATABASE SETUP COMPLETE!' as status,
    '✅ Extension: pgcrypto enabled' as extension,
    '✅ Search path: public, pg_catalog' as search_path,
    '✅ Tables: sessions, users, messages, command_logs, system_metrics, user_activity' as tables,
    '✅ Functions: log_user_activity, get_user_stats, get_system_overview' as functions,
    '✅ Policies: All RLS policies created with TO service_role' as policies,
    '✅ Indexes: Performance indexes created (syntax fixed)' as indexes,
    '✅ Triggers: Auto-updated timestamps configured' as triggers,
    NOW() as setup_completed_at;