/*
  # Add Profile Insert Policy

  1. Purpose
    - Allow users to create their own profile during signup
  
  2. Changes
    - Add INSERT policy for profiles table
*/

CREATE POLICY "Users can insert own profile during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);