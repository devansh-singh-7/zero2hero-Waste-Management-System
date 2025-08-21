-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255),
    "email" varchar(255) UNIQUE,
    "phone" varchar(32) UNIQUE,
    "password_hash" text NOT NULL,
    "emailVerified" timestamp,
    "image" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);
