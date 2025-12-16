/*
  # Create TypeMind Ranking System

  1. New Tables
    - `typemind_user_rankings` - Store user ranking information
      - `user_id` (uuid, primary key, foreign key to typemind_profiles)
      - `total_score` (integer)
      - `rank_level` (text) - S, A, B, C, D
      - `proficiency_level` (text) - Beginner, Intermediate, Advanced
      - `total_lessons_completed` (integer)
      - `total_time_spent` (integer - seconds)
      - `average_accuracy` (decimal)
      - `average_wpm` (integer)
      - `leaderboard_position` (integer)
      - `theme` (text) - gold, silver, bronze, standard
      - `updated_at` (timestamp)
      - `created_at` (timestamp)

    - `typemind_certifications` - Track generated certificates
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to typemind_profiles)
      - `rank_achieved` (text)
      - `issued_at` (timestamp)
      - `certificate_data` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can read their own data
    - TypeMind admins can read all data
    - System can insert/update via triggers

  3. Functions & Triggers
    - Auto-update rankings when lesson completed
    - Calculate leaderboard positions
    - Issue certificates on rank improvement

  4. Notes
    - Rank thresholds: S (900+), A (700+), B (500+), C (300+), D (<300)
    - Proficiency: Advanced (60+ WPM, 95%+ accuracy), Intermediate (40+ WPM, 85%+ accuracy), Beginner (else)
*/

-- Create typemind_user_rankings table
CREATE TABLE IF NOT EXISTS typemind_user_rankings (
  user_id uuid PRIMARY KEY REFERENCES typemind_profiles(id) ON DELETE CASCADE,
  total_score integer DEFAULT 0,
  rank_level text DEFAULT 'D',
  proficiency_level text DEFAULT 'Beginner',
  total_lessons_completed integer DEFAULT 0,
  total_time_spent integer DEFAULT 0,
  average_accuracy decimal(5,2) DEFAULT 0,
  average_wpm integer DEFAULT 0,
  leaderboard_position integer DEFAULT 0,
  theme text DEFAULT 'standard',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create typemind_certifications table
CREATE TABLE IF NOT EXISTS typemind_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES typemind_profiles(id) ON DELETE CASCADE NOT NULL,
  rank_achieved text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  certificate_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_typemind_certifications_user_id ON typemind_certifications(user_id);

-- Enable RLS
ALTER TABLE typemind_user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE typemind_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rankings
CREATE POLICY "Users can read own ranking"
  ON typemind_user_rankings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "TypeMind admins can read all rankings"
  ON typemind_user_rankings FOR SELECT
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

CREATE POLICY "System can insert rankings"
  ON typemind_user_rankings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update rankings"
  ON typemind_user_rankings FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for certifications
CREATE POLICY "Users can read own certifications"
  ON typemind_certifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "TypeMind admins can read all certifications"
  ON typemind_certifications FOR SELECT
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

CREATE POLICY "System can insert certifications"
  ON typemind_certifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to calculate rank level based on score
CREATE OR REPLACE FUNCTION typemind_calculate_rank_level(score integer)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF score >= 900 THEN RETURN 'S';
  ELSIF score >= 700 THEN RETURN 'A';
  ELSIF score >= 500 THEN RETURN 'B';
  ELSIF score >= 300 THEN RETURN 'C';
  ELSE RETURN 'D';
  END IF;
END;
$$;

-- Function to calculate proficiency level
CREATE OR REPLACE FUNCTION typemind_calculate_proficiency_level(avg_wpm integer, avg_accuracy decimal)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF avg_wpm >= 60 AND avg_accuracy >= 95 THEN RETURN 'Advanced';
  ELSIF avg_wpm >= 40 AND avg_accuracy >= 85 THEN RETURN 'Intermediate';
  ELSE RETURN 'Beginner';
  END IF;
END;
$$;

-- Function to update user rankings
CREATE OR REPLACE FUNCTION typemind_update_user_ranking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_score integer;
  v_total_lessons integer;
  v_total_time integer;
  v_avg_accuracy decimal;
  v_avg_wpm integer;
  v_rank_level text;
  v_proficiency text;
  v_old_rank text;
BEGIN
  -- Calculate aggregates
  SELECT 
    COALESCE(SUM(CASE WHEN is_first_completion THEN score ELSE 0 END), 0),
    COUNT(DISTINCT lesson_id),
    COALESCE(SUM(time_spent), 0),
    COALESCE(AVG(accuracy), 0),
    COALESCE(AVG(wpm), 0)
  INTO v_total_score, v_total_lessons, v_total_time, v_avg_accuracy, v_avg_wpm
  FROM typemind_lesson_completions
  WHERE user_id = NEW.user_id;

  -- Calculate rank and proficiency
  v_rank_level := typemind_calculate_rank_level(v_total_score);
  v_proficiency := typemind_calculate_proficiency_level(v_avg_wpm, v_avg_accuracy);

  -- Get old rank for certification check
  SELECT rank_level INTO v_old_rank
  FROM typemind_user_rankings
  WHERE user_id = NEW.user_id;

  -- Insert or update ranking
  INSERT INTO typemind_user_rankings (
    user_id, total_score, rank_level, proficiency_level,
    total_lessons_completed, total_time_spent,
    average_accuracy, average_wpm, updated_at
  ) VALUES (
    NEW.user_id, v_total_score, v_rank_level, v_proficiency,
    v_total_lessons, v_total_time,
    v_avg_accuracy, v_avg_wpm, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = v_total_score,
    rank_level = v_rank_level,
    proficiency_level = v_proficiency,
    total_lessons_completed = v_total_lessons,
    total_time_spent = v_total_time,
    average_accuracy = v_avg_accuracy,
    average_wpm = v_avg_wpm,
    updated_at = now();

  -- Issue certificate if rank improved
  IF v_old_rank IS NOT NULL AND v_old_rank != v_rank_level THEN
    INSERT INTO typemind_certifications (user_id, rank_achieved, certificate_data)
    VALUES (NEW.user_id, v_rank_level, jsonb_build_object(
      'previous_rank', v_old_rank,
      'new_rank', v_rank_level,
      'total_score', v_total_score
    ));
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update rankings after lesson completion
DROP TRIGGER IF EXISTS typemind_update_ranking_after_lesson ON typemind_lesson_completions;
CREATE TRIGGER typemind_update_ranking_after_lesson
  AFTER INSERT ON typemind_lesson_completions
  FOR EACH ROW
  EXECUTE FUNCTION typemind_update_user_ranking();

-- Function to update leaderboard positions
CREATE OR REPLACE FUNCTION typemind_update_leaderboard_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_score DESC, average_wpm DESC) as position,
      CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY total_score DESC, average_wpm DESC) = 1 THEN 'gold'
        WHEN ROW_NUMBER() OVER (ORDER BY total_score DESC, average_wpm DESC) = 2 THEN 'silver'
        WHEN ROW_NUMBER() OVER (ORDER BY total_score DESC, average_wpm DESC) = 3 THEN 'bronze'
        ELSE 'standard'
      END as theme
    FROM typemind_user_rankings
  )
  UPDATE typemind_user_rankings ur
  SET 
    leaderboard_position = ru.position,
    theme = ru.theme
  FROM ranked_users ru
  WHERE ur.user_id = ru.user_id;
END;
$$;