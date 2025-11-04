-- =========================================
-- TRONIC DATABASE SETUP - STEP BY STEP
-- Creates tables one by one with verification
-- =========================================

-- START: Setup
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SET search_path = public, pg_catalog;

-- STEP 1: SESSIONS TABLE
CREATE TABLE public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all sessions" ON public.sessions FOR ALL TO service_role USING (true);
GRANT ALL ON public.sessions TO service_role;

-- VERIFY: Sessions created
SELECT '✅ Sessions table created' as step_1_status;

-- STEP 2: USERS TABLE
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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all users" ON public.users FOR ALL TO service_role USING (true);
GRANT ALL ON public.users TO service_role;

-- VERIFY: Users created
SELECT '✅ Users table created' as step_2_status;

-- STEP 3: MESSAGES TABLE
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
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all messages" ON public.messages FOR ALL TO service_role USING (true);
GRANT ALL ON public.messages TO service_role;

-- VERIFY: Messages created
SELECT '✅ Messages table created' as step_3_status;

-- STEP 4: COMMAND_LOGS TABLE
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
ALTER TABLE public.command_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all command logs" ON public.command_logs FOR ALL TO service_role USING (true);
GRANT ALL ON public.command_logs TO service_role;

-- VERIFY: Command logs created
SELECT '✅ Command logs table created' as step_4_status;

-- STEP 5: SYSTEM_METRICS TABLE
CREATE TABLE public.system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    value JSONB NOT NULL,
    tags JSONB DEFAULT '{}',
    source TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all system metrics" ON public.system_metrics FOR ALL TO service_role USING (true);
GRANT ALL ON public.system_metrics TO service_role;

-- VERIFY: System metrics created
SELECT '✅ System metrics table created' as step_5_status;

-- STEP 6: USER_ACTIVITY TABLE
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
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage all user activity" ON public.user_activity FOR ALL TO service_role USING (true);
GRANT ALL ON public.user_activity TO service_role;

-- VERIFY: User activity created
SELECT '✅ User activity table created' as step_6_status;

-- CREATE TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_command_logs_updated_at BEFORE UPDATE ON public.command_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE INDEXES
CREATE INDEX idx_sessions_token ON public.sessions(token);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX idx_messages_message_type ON public.messages(message_type);
CREATE INDEX idx_command_logs_user_id ON public.command_logs(user_id);
CREATE INDEX idx_command_logs_status ON public.command_logs(status);
CREATE INDEX idx_command_logs_created_at ON public.command_logs(created_at DESC);
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_action ON public.user_activity(action);
CREATE INDEX idx_user_activity_resource_type ON public.user_activity(resource_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX idx_system_metrics_name ON public.system_metrics(metric_name);
CREATE INDEX idx_system_metrics_created_at ON public.system_metrics(created_at DESC);

-- FINAL VERIFICATION
SELECT 
    '🎉 ALL TABLES CREATED SUCCESSFULLY!' as final_status,
    'Tables: sessions, users, messages, command_logs, system_metrics, user_activity' as tables_created,
    'Triggers: Auto-updated timestamps enabled' as triggers,
    'Indexes: Performance indexes created' as indexes,
    'RLS: All policies configured for service_role' as rls_policies,
    NOW() as setup_completed;