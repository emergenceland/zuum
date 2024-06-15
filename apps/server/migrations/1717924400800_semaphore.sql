-- Up Migration
CREATE TABLE pods (
	semaphore_id VARCHAR NOT NULL PRIMARY KEY,
	strava_id VARCHAR(255) UNIQUE,
	proof JSONB NOT NULL,
	created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

ALTER TABLE pods 
ADD CONSTRAINT fk_strava_id
FOREIGN KEY (strava_id)
REFERENCES users(id)
ON DELETE CASCADE;


-- Down Migration
DROP table pods;