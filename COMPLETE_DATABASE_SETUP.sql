-- TRONIC Platform - Complete Database Setup
-- This script drops everything and creates a fresh database setup

-- Drop existing objects (in reverse dependency order)
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS command_logs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS log_user_activity(UUID, TEXT, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_stats(UUID) CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage all sessions" ON sessions CASCADE;
DROP POLICY IF EXISTS "Service role can manage all users" ON users CASCADE;
DROP POLICY IF EXISTS "Service role can manage all messages" ON messages CASCADE;
DROP POLICY IF EXISTS "Service role can manage all command logs" ON command_logs CASCADE;
DROP POLICY IF EXISTS "Service role can manage all system metrics" ON system_metrics CASCADE;
DROP POLICY IF EXISTS "Service role can manage all user activity" ON user_activity CASCADE;

-- Disable RLS temporarily for setup
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- =====================================
-- CREATE ALL TABLES
-- =====================================

-- Sessions table - stores user sessions
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table - extends auth.users with additional profile data
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table - stores chat messages and AI interactions
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    ai_response TEXT,
    message_type TEXT DEFAULT 'user', -- 'user' or 'ai'
    context JSONB DEFAULT '{}', -- Store conversation context
    metadata JSONB DEFAULT '{}', -- Store additional metadata
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Command logs table - tracks executed commands and their results
CREATE TABLE command_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    arguments TEXT,
    output TEXT,
    error_message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System metrics table - stores system performance and usage data
CREATE TABLE system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    value JSONB NOT NULL,
    tags JSONB DEFAULT '{}', -- For categorization
    source TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity table - comprehensive activity logging
CREATE TABLE user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT, -- 'message', 'command', 'login', etc.
    resource_id UUID, -- ID of the affected resource
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- =====================================
-- CREATE RLS POLICIES
-- =====================================

-- Sessions policies - service role can manage all
CREATE POLICY "Service role can manage all sessions" ON sessions
FOR ALL USING (auth.role() = 'service_role');

-- Users policies - service role can manage all
CREATE POLICY "Service role can manage all users" ON users
FOR ALL USING (auth.role() = 'service_role');

-- Messages policies - service role can manage all
CREATE POLICY "Service role can manage all messages" ON messages
FORALL USING (auth.role() = 'service_role');

-- Command logs policies - service role can manage all
CREATE POLICY "Service role can manage all command logs" ON command_logs
FOR ALL USING (auth.role() = 'service_role');

-- System metrics policies - service role can manage all
CREATE POLICY "Service role can manage all system metrics" ON system_metrics
FOR ALL USING (auth.role() = 'service_role');

-- User activity policies - service role can manage all
CREATE POLICY "Service role can manage all user activity" ON user_activity
FOR ALL USING (auth.role() = 'service_role');

-- =====================================
-- CREATE FUNCTIONS
-- =====================================

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
    INSERT INTO user_activity (
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
    -- Get message count
    SELECT COUNT(*) INTO total_messages 
    FROM messages WHERE user_id = user_uuid;
    
    -- Get command count
    SELECT COUNT(*) INTO total_commands 
    FROM command_logs WHERE user_id = user_uuid;
    
    -- Get last activity
    SELECT MAX(created_at) INTO last_activity 
    FROM user_activity WHERE user_id = user_uuid;
    
    -- Get average response time
    SELECT COALESCE(AVG(execution_time_ms), 0) INTO avg_response_time 
    FROM command_logs 
    WHERE user_id = user_uuid AND status = 'completed' AND execution_time_ms IS NOT NULL;
    
    -- Build result
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
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM auth.users;
    
    -- Count total messages
    SELECT COUNT(*) INTO total_messages FROM messages;
    
    -- Count total commands
    SELECT COUNT(*) INTO total_commands FROM command_logs;
    
    -- Count recent activity (last 24 hours)
    SELECT COUNT(*) INTO recent_activity_count 
    FROM user_activity 
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

-- =====================================
-- CREATE TRIGGERS
-- =====================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to relevant tables
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_command_logs_updated_at 
    BEFORE UPDATE ON command_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================

-- Session indexes
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Message indexes
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_message_type ON messages(message_type);

-- Command log indexes
CREATE INDEX idx_command_logs_user_id ON command_logs(user_id);
CREATE INDEX idx_command_logs_status ON command_logs(status);
CREATE INDEX idx_command_logs_created_at ON command_logs(created_at DESC);

-- User activity indexes
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_action ON user_activity(action);
CREATE INDEX idx_user_activity_resource_type ON user_activity(resource_type);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);

-- System metrics indexes
CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_created_at ON system_metrics(created_at DESC);

-- =====================================
-- GRANT PERMISSIONS
-- =====================================

-- Grant schema access
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Re-enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- =====================================
-- SUCCESS MESSAGE
-- =====================================

SELECT 
    'TRONIC Database Setup Complete!' as status,
    'All tables, functions, and policies created successfully.' as message,
    'Tables created: sessions, users, messages, command_logs, system_metrics, user_activity' as tables,
    'Functions created: log_user_activity, get_user_stats, get_system_overview' as functions,
    NOW() as setup_completed_at;
