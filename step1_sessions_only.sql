-- TRONIC Database Setup - Step by Step
-- Let's create tables one by one to avoid errors

-- Step 1: Create Sessions Table Only
-- (Run this first, then we'll add other tables)

CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role can manage all sessions" ON sessions
FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON sessions TO service_role;

-- Verify table was created
SELECT 'Sessions table created successfully!' as status;