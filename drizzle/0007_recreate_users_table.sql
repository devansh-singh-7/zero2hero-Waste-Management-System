-- Create temp table with all data
CREATE TABLE users_temp AS SELECT * FROM users;

-- Drop original table
DROP TABLE users CASCADE;

-- Recreate users table with correct schema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    "emailVerified" TIMESTAMP,
    image TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Copy data back if it exists
INSERT INTO users (id, name, email, password_hash, "emailVerified", image, created_at, updated_at)
SELECT id, name, email, password_hash, "emailVerified", image, created_at, updated_at
FROM users_temp
ON CONFLICT DO NOTHING;

-- Drop temp table
DROP TABLE users_temp;
