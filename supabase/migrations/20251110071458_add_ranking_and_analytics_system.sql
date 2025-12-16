/*
  # Comprehensive Ranking and Analytics System

  ## Overview
  This migration adds a complete ranking, leaderboard, and analytics tracking system for the TypeMaster application.

  ## 1. New Tables
  
  ### `activity_logs`
  Tracks all student typing activities and practice sessions
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `activity_type` (text) - Type of activity (lesson, practice, assessment)
  - `duration_seconds` (integer) - Time spent on activity
  - `wpm` (integer) - Words per minute achieved
  - `accuracy` (numeric) - Accuracy percentage (0-100)
  - `errors` (integer) - Number of errors made
  - `text_content` (text) - The text that was typed
  - `created_at` (timestamptz) - When activity occurred
  
  ### `user_rankings`
  Stores calculated rankings and performance metrics
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key, unique) - References profiles.id
  - `total_points` (integer) - Cumulative performance points
  - `total_time_hours` (numeric) - Total practice time in hours
  - `average_wpm` (numeric) - Average words per minute
  - `average_accuracy` (numeric) - Average accuracy percentage
  - `rank_grade` (text) - S-Rank, A-Rank, B-Rank, C-Rank, D-Rank
  - `rank_category` (text) - Beginner, Intermediate, Advanced
  - `category_position` (integer) - Position within category (1, 2, 3, etc.)
  - `overall_position` (integer) - Overall leaderboard position
  - `theme` (text) - UI theme (gold, silver, bronze, standard)
  - `updated_at` (timestamptz) - Last ranking calculation
  
  ### `leaderboard_history`
  Tracks historical leaderboard snapshots for analytics
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `rank_grade` (text) - Rank at snapshot time
  - `rank_category` (text) - Category at snapshot time
  - `category_position` (integer) - Position at snapshot time
  - `total_points` (integer) - Points at snapshot time
  - `snapshot_date` (date) - Date of snapshot
  - `created_at` (timestamptz) - When snapshot was created

  ## 2. Functions
  
  ### `calculate_user_ranking()`
  Automatically calculates and updates user rankings based on performance metrics
  - Calculates total points from activity logs
  - Determines rank grade (S, A, B, C, D) based on points
  - Assigns rank category (Beginner, Intermediate, Advanced) based on performance
  - Calculates positions within categories and overall
  - Assigns themes (gold, silver, bronze, standard) based on position
  
  ### `update_rankings_trigger()`
  Trigger function that recalculates rankings when new activities are logged

  ## 3. Security
  - Enable RLS on all new tables
  - Students can view their own activity logs and rankings
  - Students can insert their own activity logs
  - Admins can view all logs, rankings, and history
  - Admins can update rankings and manage system
  
  ## 4. Indexes
  - Index on activity_logs(user_id, created_at) for efficient querying
  - Index on user_rankings(total_points DESC) for leaderboard performance
  - Index on user_rankings(rank_category, category_position) for category leaderboards
  
  ## 5. Important Notes
  - Points calculation: (WPM × Accuracy ÷ 100) + (Duration in minutes × 2)
  - Rank Grades: S-Rank (1000+), A-Rank (700-999), B-Rank (400-699), C-Rank (200-399), D-Rank (0-199)
  - Categories: Advanced (avg WPM ≥ 60), Intermediate (30-59), Beginner (0-29)
  - Themes: Gold (1st in category), Silver (2nd), Bronze (3rd), Standard (others)
*/

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'lesson',
  duration_seconds integer NOT NULL DEFAULT 0,
  wpm integer NOT NULL DEFAULT 0,
  accuracy numeric(5,2) NOT NULL DEFAULT 0.00,
  errors integer NOT NULL DEFAULT 0,
  text_content text,
  created_at timestamptz DEFAULT now()
);

-- Create user_rankings table
CREATE TABLE IF NOT EXISTS user_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  total_time_hours numeric(10,2) NOT NULL DEFAULT 0.00,
  average_wpm numeric(6,2) NOT NULL DEFAULT 0.00,
  average_accuracy numeric(5,2) NOT NULL DEFAULT 0.00,
  rank_grade text NOT NULL DEFAULT 'D-Rank',
  rank_category text NOT NULL DEFAULT 'Beginner',
  category_position integer NOT NULL DEFAULT 0,
  overall_position integer NOT NULL DEFAULT 0,
  theme text NOT NULL DEFAULT 'standard',
  updated_at timestamptz DEFAULT now()
);

-- Create leaderboard_history table
CREATE TABLE IF NOT EXISTS leaderboard_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank_grade text NOT NULL,
  rank_category text NOT NULL,
  category_position integer NOT NULL,
  total_points integer NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created 
  ON activity_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_rankings_points 
  ON user_rankings(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_user_rankings_category 
  ON user_rankings(rank_category, category_position);

CREATE INDEX IF NOT EXISTS idx_leaderboard_history_snapshot 
  ON leaderboard_history(snapshot_date DESC, category_position);

-- Enable RLS on all tables
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_history ENABLE ROW LEVEL SECURITY;

-- Activity Logs Policies
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User Rankings Policies
CREATE POLICY "Users can view all rankings"
  ON user_rankings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage rankings"
  ON user_rankings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Leaderboard History Policies
CREATE POLICY "Users can view leaderboard history"
  ON leaderboard_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage leaderboard history"
  ON leaderboard_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to calculate and update user rankings
CREATE OR REPLACE FUNCTION calculate_user_ranking(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_points integer;
  v_total_time_hours numeric;
  v_avg_wpm numeric;
  v_avg_accuracy numeric;
  v_rank_grade text;
  v_rank_category text;
  v_theme text;
  v_category_position integer;
  v_overall_position integer;
BEGIN
  -- Calculate metrics from activity logs
  SELECT 
    COALESCE(SUM(
      (wpm * accuracy / 100.0) + (duration_seconds / 60.0 * 2)
    )::integer, 0),
    COALESCE(SUM(duration_seconds) / 3600.0, 0),
    COALESCE(AVG(wpm), 0),
    COALESCE(AVG(accuracy), 0)
  INTO v_total_points, v_total_time_hours, v_avg_wpm, v_avg_accuracy
  FROM activity_logs
  WHERE user_id = target_user_id;

  -- Determine rank grade based on points
  IF v_total_points >= 1000 THEN
    v_rank_grade := 'S-Rank';
  ELSIF v_total_points >= 700 THEN
    v_rank_grade := 'A-Rank';
  ELSIF v_total_points >= 400 THEN
    v_rank_grade := 'B-Rank';
  ELSIF v_total_points >= 200 THEN
    v_rank_grade := 'C-Rank';
  ELSE
    v_rank_grade := 'D-Rank';
  END IF;

  -- Determine rank category based on average WPM
  IF v_avg_wpm >= 60 THEN
    v_rank_category := 'Advanced';
  ELSIF v_avg_wpm >= 30 THEN
    v_rank_category := 'Intermediate';
  ELSE
    v_rank_category := 'Beginner';
  END IF;

  -- Insert or update user ranking
  INSERT INTO user_rankings (
    user_id, total_points, total_time_hours, average_wpm, average_accuracy,
    rank_grade, rank_category, updated_at
  )
  VALUES (
    target_user_id, v_total_points, v_total_time_hours, v_avg_wpm, v_avg_accuracy,
    v_rank_grade, v_rank_category, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = v_total_points,
    total_time_hours = v_total_time_hours,
    average_wpm = v_avg_wpm,
    average_accuracy = v_avg_accuracy,
    rank_grade = v_rank_grade,
    rank_category = v_rank_category,
    updated_at = now();

  -- Calculate positions and assign themes
  -- First, update all positions in the same category
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (
        PARTITION BY rank_category 
        ORDER BY total_points DESC, average_wpm DESC
      ) as cat_pos,
      ROW_NUMBER() OVER (
        ORDER BY total_points DESC, average_wpm DESC
      ) as overall_pos
    FROM user_rankings
    WHERE rank_category = v_rank_category
  )
  UPDATE user_rankings ur
  SET 
    category_position = ru.cat_pos,
    overall_position = ru.overall_pos,
    theme = CASE 
      WHEN ru.cat_pos = 1 THEN 'gold'
      WHEN ru.cat_pos = 2 THEN 'silver'
      WHEN ru.cat_pos = 3 THEN 'bronze'
      ELSE 'standard'
    END
  FROM ranked_users ru
  WHERE ur.user_id = ru.user_id;

END;
$$;

-- Function to handle ranking updates via trigger
CREATE OR REPLACE FUNCTION update_rankings_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recalculate ranking for the affected user
  PERFORM calculate_user_ranking(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger on activity_logs
DROP TRIGGER IF EXISTS trigger_update_rankings ON activity_logs;
CREATE TRIGGER trigger_update_rankings
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_rankings_trigger();

-- Function to create daily leaderboard snapshots
CREATE OR REPLACE FUNCTION create_leaderboard_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO leaderboard_history (
    user_id, rank_grade, rank_category, category_position, total_points, snapshot_date
  )
  SELECT 
    user_id, rank_grade, rank_category, category_position, total_points, CURRENT_DATE
  FROM user_rankings
  ON CONFLICT DO NOTHING;
END;
$$;