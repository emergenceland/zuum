-- Up Migration
-- Drop the old user table
DROP TABLE IF EXISTS users;

-- Create the new user table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,   
  data JSONB NOT NULL
);

-- Down Migration
DROP TABLE IF EXISTS users;