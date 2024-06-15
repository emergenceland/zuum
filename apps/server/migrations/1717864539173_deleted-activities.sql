-- Up Migration
ALTER TABLE activities ADD COLUMN deleted boolean NOT NULL DEFAULT false;

-- Down Migration
ALTER TABLE activities DROP COLUMN deleted;