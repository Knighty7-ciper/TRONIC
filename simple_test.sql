-- Simple Database Test
SELECT 
    current_database() as database_name,
    current_user as current_user,
    current_timestamp as test_time,
    'Database connection working' as status;