ALTER TABLE collected_wastes
ADD COLUMN IF NOT EXISTS amount varchar(255),
ADD COLUMN IF NOT EXISTS verification_result jsonb;
