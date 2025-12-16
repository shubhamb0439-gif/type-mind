/*
  # Add Insert Profile Policy

  1. Changes
    - Add policy to allow new users to insert their own profile during signup
  
  2. Security
    - Users can only insert their own profile (auth.uid() = id)
*/

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
