-- Add NextAuth required columns to existing users table
ALTER TABLE "users" ADD COLUMN "emailVerified" timestamp;

-- Create accounts table for NextAuth
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);

-- Create sessions table for NextAuth
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionToken" varchar(255) NOT NULL UNIQUE,
	"userId" integer NOT NULL,
	"expires" timestamp NOT NULL
);

-- Create verificationToken table for NextAuth
CREATE TABLE "verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add unique constraint for verificationToken
ALTER TABLE "verificationToken" ADD CONSTRAINT "verificationToken_identifier_token_unique" UNIQUE("identifier", "token");



















