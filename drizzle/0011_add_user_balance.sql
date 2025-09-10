-- Add balance column to users table
ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0 NOT NULL;

-- Update the updated_at column name for consistency
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
