-- Migration: custom auth token table for email verification, password reset, OTP, and invite flows.
-- Replaces Supabase's built-in email sending with a custom Resend-powered system.

CREATE TABLE IF NOT EXISTS auth_tokens (
  id         uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      text         NOT NULL,  -- SHA-256 hash of the plaintext token/OTP
  type       text         NOT NULL CHECK (type IN ('verification', 'reset', 'otp', 'invite')),
  expires_at timestamptz  NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- Index for fast lookup by user + type
CREATE INDEX IF NOT EXISTS auth_tokens_user_id_type_idx ON auth_tokens (user_id, type);

-- RLS: users cannot read or write this table directly; all access is via service role.
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- No policies are added intentionally — all CRUD goes through server-side admin routes.
