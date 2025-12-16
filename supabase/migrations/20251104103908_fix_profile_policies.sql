/*
  # Fix Profile RLS Policies

  1. Purpose
    - Fix infinite recursion in admin policies
    - Use a simpler approach that doesn't query profiles within profiles policies
  
  2. Changes
    - Drop existing problematic policies
    - Create new policies without recursion
*/

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow read access for all authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);