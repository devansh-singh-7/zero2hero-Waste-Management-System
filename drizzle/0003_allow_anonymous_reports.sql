-- Migration: Allow anonymous waste reports
-- Date: 2024-01-XX

-- Make user_id nullable to allow anonymous reports
ALTER TABLE reports ALTER COLUMN user_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN reports.user_id IS 'User ID for authenticated reports, NULL for anonymous reports';














