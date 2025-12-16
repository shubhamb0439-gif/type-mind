/*
  # Fix Infinite Recursion in RLS Policies

  1. Changes
    - Drop the problematic admin policies that cause infinite recursion
    - Create new policies that use app_metadata instead of querying the profiles table
    - Update auth.users table to include role in app_metadata for existing admin
  
  2. Security
    - Maintain same security level but avoid recursive queries
    - Use JWT claims (app_metadata) which doesn't trigger RLS
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new non-recursive policies using app_metadata
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Update the admin user's app_metadata to include role
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@typemaster.ai';
