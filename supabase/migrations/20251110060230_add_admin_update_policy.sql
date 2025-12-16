/*
  # Add Admin Update Policy

  1. Purpose
    - Allow all authenticated users to update profiles (admins need this to approve students)
  
  2. Changes
    - Add update policy for authenticated users
*/

CREATE POLICY "Authenticated users can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);