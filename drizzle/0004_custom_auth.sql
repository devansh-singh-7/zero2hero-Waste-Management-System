-- Migration: Add custom auth columns to users
-- Adds phone and password_hash columns for email/phone + password auth

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

-- Optional: make phone unique if provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'users_phone_unique'
  ) THEN
    CREATE UNIQUE INDEX users_phone_unique ON users (phone);
  END IF;
END $$;





