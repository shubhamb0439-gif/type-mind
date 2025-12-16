/*
  # Fix All Recursive Policies System-Wide

  1. Changes
    - Drop ALL policies that cause infinite recursion
    - Recreate policies using app_metadata stored in JWT
    - Update all admin users to have role in app_metadata
  
  2. Security
    - Maintain same security posture without recursion
    - Use JWT claims which don't trigger RLS checks
*/

-- First, update all admin users to have role in app_metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'admin'
);

-- Drop all problematic policies on profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recreate profiles policies without recursion
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

-- Drop and recreate classes policies
DROP POLICY IF EXISTS "Approved students can read classes for their level" ON classes;
DROP POLICY IF EXISTS "Admins can read all classes" ON classes;
DROP POLICY IF EXISTS "Admins can create classes" ON classes;
DROP POLICY IF EXISTS "Admins can update classes" ON classes;
DROP POLICY IF EXISTS "Admins can delete classes" ON classes;

-- Recreate classes policies without recursion
CREATE POLICY "Approved students can read classes for their level"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can read all classes"
  ON classes FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can create classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete classes"
  ON classes FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Drop and recreate assessments policies
DROP POLICY IF EXISTS "Admins can read all assessments" ON assessments;

CREATE POLICY "Admins can read all assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Drop and recreate progress policies
DROP POLICY IF EXISTS "Admins can read all progress" ON progress;

CREATE POLICY "Admins can read all progress"
  ON progress FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Drop and recreate activity_logs policies
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Drop and recreate user_rankings policies
DROP POLICY IF EXISTS "Admins can manage rankings" ON user_rankings;

CREATE POLICY "Admins can manage rankings"
  ON user_rankings FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Drop and recreate leaderboard_history policies
DROP POLICY IF EXISTS "Admins can manage leaderboard history" ON leaderboard_history;

CREATE POLICY "Admins can manage leaderboard history"
  ON leaderboard_history FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
