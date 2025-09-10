DO $$ 
BEGIN
    -- Drop tables in reverse order of dependencies
    DROP TABLE IF EXISTS "transactions" CASCADE;
    DROP TABLE IF EXISTS "collected_wastes" CASCADE;
    DROP TABLE IF EXISTS "user_rewards" CASCADE;
    DROP TABLE IF EXISTS "available_rewards" CASCADE;
    DROP TABLE IF EXISTS "notifications" CASCADE;
    DROP TABLE IF EXISTS "reports" CASCADE;
    DROP TABLE IF EXISTS "users" CASCADE;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "email" varchar(255) NOT NULL,
    "password_hash" varchar(255) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "image" text,
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "location" text NOT NULL,
    "waste_type" varchar(255) NOT NULL,
    "amount" varchar(255) NOT NULL,
    "image_url" text,
    "verification_result" jsonb,
    "status" varchar(255) DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "collector_id" integer,
    CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_collector" FOREIGN KEY ("collector_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "message" text NOT NULL,
    "type" varchar(50) NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "fk_notification_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "collected_wastes" (
    "id" serial PRIMARY KEY NOT NULL,
    "report_id" integer NOT NULL,
    "collector_id" integer NOT NULL,
    "collection_date" timestamp NOT NULL,
    "status" varchar(20) DEFAULT 'collected' NOT NULL,
    CONSTRAINT "fk_report" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_waste_collector" FOREIGN KEY ("collector_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "available_rewards" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "points_required" integer NOT NULL,
    "level_required" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_rewards" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "reward_id" integer NOT NULL,
    "redeemed_at" timestamp DEFAULT now() NOT NULL,
    "status" varchar(20) DEFAULT 'active' NOT NULL,
    CONSTRAINT "fk_user_reward_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_user_reward_reward" FOREIGN KEY ("reward_id") REFERENCES "available_rewards"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "transactions" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "type" varchar(20) NOT NULL,
    "amount" integer NOT NULL,
    "description" text NOT NULL,
    "date" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "fk_transaction_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
