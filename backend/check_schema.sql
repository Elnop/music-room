-- Check current columns in user_profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check existing indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
ORDER BY indexname;
