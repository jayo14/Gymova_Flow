-- Rename email_verified_at to verified_at in profiles table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE profiles RENAME COLUMN email_verified_at TO verified_at;
    END IF;
END
$$;
