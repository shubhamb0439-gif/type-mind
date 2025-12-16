/*
  # Create TypeMind Lesson Tracking Tables

  1. New Tables
    - `typemind_assessments` - Initial student assessment results
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to typemind_profiles)
      - `wpm` (integer)
      - `accuracy` (numeric)
      - `text_content` (text)
      - `created_at` (timestamptz)

    - `typemind_progress` - Student progress on specific classes
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to typemind_profiles)
      - `class_id` (uuid, foreign key to typemind_classes)
      - `completed` (boolean)
      - `time_spent_minutes` (integer)
      - `wpm` (integer)
      - `accuracy` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (student_id, class_id)

    - `typemind_lesson_completions` - Track all lesson attempts
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to typemind_profiles)
      - `lesson_id` (text)
      - `score` (integer)
      - `accuracy` (decimal)
      - `wpm` (integer - words per minute)
      - `time_spent` (integer - seconds)
      - `completed_at` (timestamptz)
      - `is_first_completion` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Students can read/write their own data
    - TypeMind admins can read all data

  3. Notes
    - Assessments track initial typing skill evaluation
    - Progress tracks ongoing work on specific classes
    - Lesson completions feed into the ranking system
*/

-- Create typemind_assessments table
CREATE TABLE IF NOT EXISTS typemind_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES typemind_profiles(id) ON DELETE CASCADE,
  wpm integer NOT NULL,
  accuracy numeric(5,2) NOT NULL,
  text_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_typemind_assessments_student_id ON typemind_assessments(student_id);

-- Enable RLS
ALTER TABLE typemind_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Students can read own assessments"
  ON typemind_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "TypeMind admins can read all assessments"
  ON typemind_assessments FOR SELECT
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

CREATE POLICY "Students can create own assessments"
  ON typemind_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Create typemind_progress table
CREATE TABLE IF NOT EXISTS typemind_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES typemind_profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES typemind_classes(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  time_spent_minutes integer DEFAULT 0,
  wpm integer DEFAULT 0,
  accuracy numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_typemind_progress_student_id ON typemind_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_typemind_progress_class_id ON typemind_progress(class_id);

-- Enable RLS
ALTER TABLE typemind_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress
CREATE POLICY "Students can read own progress"
  ON typemind_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "TypeMind admins can read all progress"
  ON typemind_progress FOR SELECT
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

CREATE POLICY "Students can insert own progress"
  ON typemind_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON typemind_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Create typemind_lesson_completions table
CREATE TABLE IF NOT EXISTS typemind_lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES typemind_profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  accuracy decimal(5,2) DEFAULT 0,
  wpm integer DEFAULT 0,
  time_spent integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  is_first_completion boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_typemind_lesson_completions_user_id ON typemind_lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_typemind_lesson_completions_lesson_id ON typemind_lesson_completions(lesson_id);

-- Enable RLS
ALTER TABLE typemind_lesson_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_completions
CREATE POLICY "Users can read own lesson completions"
  ON typemind_lesson_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "TypeMind admins can read all lesson completions"
  ON typemind_lesson_completions FOR SELECT
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

CREATE POLICY "Users can insert own lesson completions"
  ON typemind_lesson_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);