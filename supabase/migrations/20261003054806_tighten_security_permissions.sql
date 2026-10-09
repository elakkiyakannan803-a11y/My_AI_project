/*
# Tighten security: revoke direct access to trigger function and rate limit table

## Changes
1. Revoke EXECUTE on `handle_new_user()` from anon and authenticated roles — this function should only be called by the database trigger, not directly via the REST API.
2. Revoke all privileges on `auth_rate_limits` from anon and authenticated roles — this table is only accessed by the service role through edge functions.

## Security Impact
- `handle_new_user()` is now only executable by the trigger on auth.users, preventing direct RPC calls.
- `auth_rate_limits` is now completely inaccessible from the frontend client (anon key). Only the service role used in edge functions can read/write it.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE ALL ON TABLE public.auth_rate_limits FROM anon, authenticated;
