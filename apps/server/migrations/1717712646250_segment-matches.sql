-- Up Migration
CREATE table user_activity_segments (
    user_id VARCHAR(255) NOT NULL references users(id),
    activity_id VARCHAR(255) PRIMARY KEY references activities(id),
    segments JSONB NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- Down Migration
DROP table user_activity_segments;