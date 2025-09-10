-- Add missing columns to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "provider" varchar(255),
ADD COLUMN IF NOT EXISTS "provider_id" varchar(255),
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;
