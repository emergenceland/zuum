-- Up Migration
CREATE TABLE activities (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  data JSONB NOT NULL
);

-- Down Migration
DROP TABLE IF EXISTS activities;