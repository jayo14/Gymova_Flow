-- Migration: Add welcome_email_sent to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_email_sent boolean DEFAULT false;
