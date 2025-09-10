-- Add image URL field to notifications table
ALTER TABLE "notifications" ADD COLUMN "image_url" text;
ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;
