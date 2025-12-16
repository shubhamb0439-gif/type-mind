/*
  # TypeMaster AI Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text: 'admin' or 'student')
      - `status` (text: 'pending', 'approved', 'denied')
      - `level` (text: 'beginner', 'intermediate', 'advanced', nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `classes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `level` (text: 'beginner', 'intermediate', 'advanced', 'all')
      - `module_type` (text: 'text', 'audio_sentence', 'audio_paragraph')
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
    
    - `assessments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles)
      - `wpm` (integer)
      - `accuracy` (numeric)
      - `text_content` (text)
      - `created_at` (timestamptz)
    
    - `progress`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles)
      - `class_id` (uuid, references classes)
      - `completed` (boolean)
      - `time_spent_minutes` (integer)
      - `wpm` (integer)
      - `accuracy` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin and student access patterns
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'student')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  level text CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  level text NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  module_type text NOT NULL CHECK (module_type IN ('text', 'audio_sentence', 'audio_paragraph')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wpm integer NOT NULL,
  accuracy numeric(5,2) NOT NULL,
  text_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create progress table
CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  time_spent_minutes integer DEFAULT 0,
  wpm integer DEFAULT 0,
  accuracy numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id)
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Classes policies
CREATE POLICY "Approved students can read classes for their level"
  ON classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.status = 'approved'
      AND (classes.level = profiles.level OR classes.level = 'all')
    )
  );

CREATE POLICY "Admins can read all classes"
  ON classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete classes"
  ON classes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Assessments policies
CREATE POLICY "Students can read own assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Students can create own assessments"
  ON assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Progress policies
CREATE POLICY "Students can read own progress"
  ON progress FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all progress"
  ON progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Students can insert own progress"
  ON progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
