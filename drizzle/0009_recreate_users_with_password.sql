-- Drop the existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Recreate the users table with all columns including password_hash
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  "emailVerified" TIMESTAMP,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
