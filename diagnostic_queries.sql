-- DIAGNOSTIC QUERIES - Run these to understand current database state

-- Check if sessions exists anywhere
SELECT table_schema, table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'sessions';

-- Check current search_path
SHOW search_path;

-- Check for sessions schema and ownership
SELECT nspname AS schema_name, relname AS table_name 
FROM pg_class c 
JOIN pg_namespace n ON n.oid = c.relnamespace 
WHERE relname = 'sessions';

-- Check for existing policies
SELECT polname, polrelid::regclass::text AS relation, schemaname 
FROM pg_policy 
JOIN pg_class on pg_policy.polrelid = pg_class.oid 
JOIN pg_namespace on pg_namespace.oid = pg_class.relnamespace 
WHERE polname ILIKE '%session%' OR polrelid::regclass::text ILIKE '%sessions%';

-- Check pgcrypto extension
SELECT name FROM pg_extension WHERE name = 'pgcrypto';