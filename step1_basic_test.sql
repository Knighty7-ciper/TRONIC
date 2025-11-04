-- STEP 1: Test Basic Connection
-- Run this first to verify everything works

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SET search_path = public, pg_catalog;

-- Test if we can create and see a simple table
CREATE TABLE public.test_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_col TEXT
);

-- Verify it was created
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'test_table';

-- Clean up test table
DROP TABLE IF EXISTS public.test_table;