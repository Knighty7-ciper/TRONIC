-- TRONIC Platform - Supabase RLS Setup
-- This replaces the problematic JWT secret configuration

-- Enable RLS on all tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role access
-- These policies allow the service role to bypass RLS restrictions

-- Sessions table policies
CREATE POLICY "Service role can manage all sessions" ON sessions
FOR ALL USING (auth.role() = 'service_role');

-- Users table policies  
CREATE POLICY "Service role can manage all users" ON users
FOR ALL USING (auth.role() = 'service_role');

-- Messages table policies
CREATE POLICY "Service role can manage all messages" ON messages
FOR ALL USING (auth.role() = 'service_role');

-- Command logs table policies
CREATE POLICY "Service role can manage all command logs" ON command_logs
FOR ALL USING (auth.role() = 'service_role');

-- System metrics table policies
CREATE POLICY "Service role can manage all system metrics" ON system_metrics
FOR ALL USING (auth.role() = 'service_role');

-- User activity table policies
CREATE POLICY "Service role can manage all user activity" ON user_activity
FOR ALL USING (auth.role() = 'service_role');

-- RPC Functions for logging (these need to be recreated)
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO user_activity (user_id, action, details, resource_type)
    VALUES (p_user_id, p_action, p_details, p_resource_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_messages', (SELECT COUNT(*) FROM messages WHERE user_id = user_uuid),
        'total_commands', (SELECT COUNT(*) FROM command_logs WHERE user_id = user_uuid),
        'last_activity', (SELECT MAX(created_at) FROM user_activity WHERE user_id = user_uuid)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
