-- PostgreSQL session storage for the Google Auth Starter application.
--
-- sid: unique identifier for each browser session.
-- sess: session data stored as JSON.
-- expire: timestamp when the session expires.
--
-- The primary key supports session lookups.
-- The expiry index supports efficient cleanup of expired sessions.

CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire"
ON user_sessions (expire);