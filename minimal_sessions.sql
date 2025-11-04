-- CREATE JUST THE SESSIONS TABLE FIRST
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow backend access
CREATE POLICY "Service role can manage all sessions" ON sessions
FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON sessions TO service_role;