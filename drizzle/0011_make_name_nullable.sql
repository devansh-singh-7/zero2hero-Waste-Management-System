-- Make name field nullable in users table
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
