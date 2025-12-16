/*
  # TypeMind AI - Ranking & Analytics System

  1. New Tables
    - `lesson_completions` - Track user lesson attempts and scores
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `lesson_id` (text)
      - `score` (integer)
      - `accuracy` (decimal)
      - `wpm` (integer - words per minute)
      - `time_spent` (integer - seconds)
      - `completed_at` (timestamp)
      - `is_first_completion` (boolean)
    
    - `user_rankings` - Store user ranking information
      - `user_id` (uuid, primary key, foreign key to profiles)
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
    
    - `certifications` - Track generated certificates
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `rank_achieved` (text)
      - `issued_at` (timestamp)
      - `certificate_url` (text)

  2. Security
    - Enable RLS on all new tables
    - Users can read their own data
    - Admins can read all data
    - System can insert/update via triggers

  3. Functions & Triggers
    - Auto-update rankings when lesson completed
    - Calculate leaderboard positions
*/

-- Create lesson_completions table
CREATE TABLE IF NOT EXISTS lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  accuracy decimal(5,2) DEFAULT 0,
  wpm integer DEFAULT 0,
  time_spent integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  is_first_completion boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- Create user_rankings table
CREATE TABLE IF NOT EXISTS user_rankings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Create certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rank_achieved text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  certificate_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);

-- Enable RLS
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_completions
CREATE POLICY "Users can read own lesson completions"
  ON lesson_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all lesson completions"
  ON lesson_completions FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Users can insert own lesson completions"
  ON lesson_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_rankings
CREATE POLICY "Users can read own ranking"
  ON user_rankings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all rankings"
  ON user_rankings FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "System can insert rankings"
  ON user_rankings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update rankings"
  ON user_rankings FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for certifications
CREATE POLICY "Users can read own certifications"
  ON certifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all certifications"
  ON certifications FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "System can insert certifications"
  ON certifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to calculate rank level based on score
CREATE OR REPLACE FUNCTION calculate_rank_level(score integer)
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
CREATE OR REPLACE FUNCTION calculate_proficiency_level(avg_wpm integer, avg_accuracy decimal)
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
CREATE OR REPLACE FUNCTION update_user_ranking()
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
  FROM lesson_completions
  WHERE user_id = NEW.user_id;

  -- Calculate rank and proficiency
  v_rank_level := calculate_rank_level(v_total_score);
  v_proficiency := calculate_proficiency_level(v_avg_wpm, v_avg_accuracy);

  -- Get old rank for certification check
  SELECT rank_level INTO v_old_rank
  FROM user_rankings
  WHERE user_id = NEW.user_id;

  -- Insert or update ranking
  INSERT INTO user_rankings (
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
    INSERT INTO certifications (user_id, rank_achieved, certificate_data)
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
DROP TRIGGER IF EXISTS update_ranking_after_lesson ON lesson_completions;
CREATE TRIGGER update_ranking_after_lesson
  AFTER INSERT ON lesson_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ranking();

-- Function to update leaderboard positions
CREATE OR REPLACE FUNCTION update_leaderboard_positions()
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
    FROM user_rankings
  )
  UPDATE user_rankings ur
  SET 
    leaderboard_position = ru.position,
    theme = ru.theme
  FROM ranked_users ru
  WHERE ur.user_id = ru.user_id;
END;
$$;
