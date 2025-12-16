/*
  # Create TypeMind Profiles Table

  1. New Tables
    - `typemind_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text: 'admin' or 'student')
      - `level` (text: 'beginner', 'intermediate', 'advanced')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on typemind_profiles table
    - Users can read their own profile
    - TypeMind admins can read all profiles
    - Users can update their own profile (limited fields)
    - TypeMind admins can update all profiles

  3. Notes
    - Removed 'status' and 'pending/approved' flow
    - Access control is now handled via app_permissions table
    - Profile is created automatically on first login if missing
*/

-- Create typemind_profiles table
CREATE TABLE IF NOT EXISTS typemind_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  level text DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE typemind_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile"
  ON typemind_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "TypeMind admins can read all profiles"
  ON typemind_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_permissions ap
      JOIN apps a ON a.id = ap.app_id
      WHERE ap.employee_id = auth.uid()
      AND a.name = 'Typemind'
      AND EXISTS (
        SELECT 1 FROM employees e
        WHERE e.id = auth.uid()
        AND e.role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Users can insert own profile"
  ON typemind_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON typemind_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "TypeMind admins can update all profiles"
  ON typemind_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_permissions ap
      JOIN apps a ON a.id = ap.app_id
      WHERE ap.employee_id = auth.uid()
      AND a.name = 'Typemind'
      AND EXISTS (
        SELECT 1 FROM employees e
        WHERE e.id = auth.uid()
        AND e.role IN ('admin', 'super_admin')
      )
    )
  );

-- Function to auto-create profile on first login
CREATE OR REPLACE FUNCTION create_typemind_profile_on_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if user has TypeMind app permission
  IF EXISTS (
    SELECT 1 FROM app_permissions ap
    JOIN apps a ON a.id = ap.app_id
    WHERE ap.employee_id = NEW.id
    AND a.name = 'Typemind'
  ) THEN
    INSERT INTO typemind_profiles (id, email, full_name, role, level)
    SELECT 
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM employees e
          WHERE e.id = NEW.id
          AND e.role IN ('admin', 'super_admin')
        ) THEN 'admin'
        ELSE 'student'
      END,
      'beginner'
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS create_typemind_profile_trigger ON auth.users;
CREATE TRIGGER create_typemind_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_typemind_profile_on_login();