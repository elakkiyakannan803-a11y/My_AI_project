/*
# Create profiles table and auth rate limiting table

## Overview
This migration creates the database schema for LoanSure AI's real authentication system.

## New Tables

### 1. `profiles`
- `id` (uuid, primary key, references auth.users ON DELETE CASCADE) — one row per authenticated user
- `name` (text, not null) — user's full name
- `phone` (text, default empty) — phone number
- `location` (text, default empty) — city/location
- `employment_type` (text, default 'Salaried') — employment category
- `monthly_income` (integer, default 0) — monthly income in INR
- `loan_preference` (text, default 'Personal Loan') — preferred loan category
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 2. `auth_rate_limits`
- `id` (uuid, primary key)
- `identifier` (text, not null) — IP address or email for rate limiting
- `action` (text, not null) — action being rate-limited (signup, login, otp_request, verification)
- `created_at` (timestamptz, default now())
- Index on (identifier, action, created_at) for fast lookups

## Security
- RLS enabled on `profiles` — users can only read/update their own profile row
- RLS enabled on `auth_rate_limits` — no direct access from frontend (service role only via edge function)
- Profile `id` defaults to `auth.uid()` so inserts from authenticated sessions work
- A trigger creates a profile row automatically when a new auth.users row is inserted

## Notes
1. The profiles table is linked 1:1 to auth.users via the id column
2. Rate limit rows are cleaned up by the edge function (old rows deleted periodically)
3. The trigger ensures every new signup gets a profile row automatically
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT 'Salaried',
  monthly_income integer NOT NULL DEFAULT 0,
  loan_preference text NOT NULL DEFAULT 'Personal Loan',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Rate limiting table — no RLS policies for anon/authenticated, so it's locked down.
-- Only the service role (used in edge functions) can access it.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_lookup ON auth_rate_limits (identifier, action, created_at);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant the trigger function access to profiles
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON TABLE public.profiles TO postgres;
