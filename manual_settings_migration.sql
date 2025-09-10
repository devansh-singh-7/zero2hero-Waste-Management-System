-- Migration: Add settings fields and rename password_hash to password
-- This migration adds the new user settings fields and renames the password column

-- Rename password_hash to password
ALTER TABLE users RENAME COLUMN password_hash TO password;

-- Add new settings columns
ALTER TABLE users ADD COLUMN public_profile_visible BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE users ADD COLUMN profile_searchable BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE users ADD COLUMN show_real_name BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN personal_stats_visible BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE users ADD COLUMN data_sharing VARCHAR(20) DEFAULT 'anonymous' NOT NULL;
ALTER TABLE users ADD COLUMN environmental_tracking BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE users ADD COLUMN collection_history_retention VARCHAR(20) DEFAULT '1year' NOT NULL;
