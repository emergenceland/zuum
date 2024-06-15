-- Up Migration
-- Add column meters_completed to users table
ALTER TABLE users ADD COLUMN score INT DEFAULT 0;

-- Down Migration
ALTER TABLE users DROP COLUMN score;