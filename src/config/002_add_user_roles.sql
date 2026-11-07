-- Add a role to every Google Auth Starter application user.
--
-- Existing users become ordinary users by default.
-- Administrator promotion is handled by the authentication service
-- using the ADMIN_EMAIL environment variable.
--
-- IF NOT EXISTS makes this migration safe to apply to a database
-- where the role column or constraint already exists.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add the role restriction only if it is not already present.
-- This matters when adopting migrations for an existing database.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_role_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'user'));
    END IF;
END
$$;
