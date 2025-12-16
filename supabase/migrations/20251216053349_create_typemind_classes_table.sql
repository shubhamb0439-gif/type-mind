/*
  # Create TypeMind Classes Table

  1. New Tables
    - `typemind_classes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text, nullable for audio-only lessons)
      - `level` (text: 'beginner', 'intermediate', 'advanced', 'all')
      - `module_type` (text: 'text', 'audio_sentence', 'audio_paragraph')
      - `audio_url` (text, nullable)
      - `audio_source` (text: 'elevenlabs' or 'upload', nullable)
      - `voice_id` (text, nullable)
      - `playback_speed` (decimal, default 1.0)
      - `transcript` (text, nullable)
      - `backspace_enabled` (boolean, default true)
      - `created_by` (uuid, references typemind_profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on typemind_classes table
    - Users with TypeMind access can read classes for their level
    - TypeMind admins can manage all classes
    - Check constraint ensures either content or transcript is provided

  3. Notes
    - Audio lessons support both ElevenLabs generation and manual upload
    - Transcript is required for audio lessons for accuracy checking
    - Backspace control allows admins to increase lesson difficulty
*/

-- Create typemind_classes table
CREATE TABLE IF NOT EXISTS typemind_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  level text NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  module_type text NOT NULL CHECK (module_type IN ('text', 'audio_sentence', 'audio_paragraph')),
  audio_url text,
  audio_source text CHECK (audio_source IN ('elevenlabs', 'upload') OR audio_source IS NULL),
  voice_id text,
  playback_speed decimal(3,1) DEFAULT 1.0 CHECK (playback_speed >= 0.5 AND playback_speed <= 2.0),
  transcript text,
  backspace_enabled boolean DEFAULT true,
  created_by uuid REFERENCES typemind_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Add check constraint to ensure either content or transcript is provided
ALTER TABLE typemind_classes ADD CONSTRAINT classes_content_or_transcript_check 
  CHECK (content IS NOT NULL OR transcript IS NOT NULL);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_typemind_classes_level ON typemind_classes(level);
CREATE INDEX IF NOT EXISTS idx_typemind_classes_created_by ON typemind_classes(created_by);

-- Enable RLS
ALTER TABLE typemind_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users with TypeMind access can read classes for their level"
  ON typemind_classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_permissions ap
      JOIN apps a ON a.id = ap.app_id
      JOIN typemind_profiles tp ON tp.id = auth.uid()
      WHERE ap.employee_id = auth.uid()
      AND a.name = 'Typemind'
      AND (typemind_classes.level = tp.level OR typemind_classes.level = 'all')
    )
  );

CREATE POLICY "TypeMind admins can read all classes"
  ON typemind_classes FOR SELECT
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

CREATE POLICY "TypeMind admins can create classes"
  ON typemind_classes FOR INSERT
  TO authenticated
  WITH CHECK (
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

CREATE POLICY "TypeMind admins can update classes"
  ON typemind_classes FOR UPDATE
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

CREATE POLICY "TypeMind admins can delete classes"
  ON typemind_classes FOR DELETE
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