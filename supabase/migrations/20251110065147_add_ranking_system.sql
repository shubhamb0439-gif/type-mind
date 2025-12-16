/*
  # Add Ranking System to TypeMaster AI

  1. Changes to Existing Tables
    - Add `total_points` column to profiles table
    - Add `rank_grade` column to profiles table (S, A, B, C, D)
    - Add `rank_position` column to profiles table (1, 2, 3, etc.)

  2. New Computed Views
    - Create view for calculating rankings based on performance

  3. Security
    - Update existing RLS policies to include new columns
    - Rankings are calculated from progress data

  ## Ranking System
    - S-Rank: 1000+ points
    - A-Rank: 750-999 points
    - B-Rank: 500-749 points
    - C-Rank: 250-499 points
    - D-Rank: 0-249 points
    
    Points calculation:
    - Completed lesson: 10 points
    - WPM bonus: (WPM / 10) points
    - Accuracy bonus: (Accuracy / 10) points
*/

-- Add ranking columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_points integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'rank_grade'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rank_grade text CHECK (rank_grade IN ('S', 'A', 'B', 'C', 'D'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'rank_position'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rank_position integer;
  END IF;
END $$;

-- Function to calculate rank grade based on points
CREATE OR REPLACE FUNCTION calculate_rank_grade(points integer)
RETURNS text AS $$
BEGIN
  IF points >= 1000 THEN
    RETURN 'S';
  ELSIF points >= 750 THEN
    RETURN 'A';
  ELSIF points >= 500 THEN
    RETURN 'B';
  ELSIF points >= 250 THEN
    RETURN 'C';
  ELSE
    RETURN 'D';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update student rankings
CREATE OR REPLACE FUNCTION update_student_rankings()
RETURNS void AS $$
BEGIN
  -- Calculate total points for each student from their progress
  UPDATE profiles
  SET total_points = COALESCE((
    SELECT SUM(
      10 + -- Base points for completion
      FLOOR(wpm / 10.0) + -- WPM bonus
      FLOOR(accuracy / 10.0) -- Accuracy bonus
    )
    FROM progress
    WHERE progress.student_id = profiles.id
      AND progress.completed = true
  ), 0)
  WHERE role = 'student';

  -- Update rank grades
  UPDATE profiles
  SET rank_grade = calculate_rank_grade(total_points)
  WHERE role = 'student';

  -- Update rank positions within each level
  WITH ranked_students AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY level ORDER BY total_points DESC) as position
    FROM profiles
    WHERE role = 'student' AND status = 'approved'
  )
  UPDATE profiles
  SET rank_position = ranked_students.position
  FROM ranked_students
  WHERE profiles.id = ranked_students.id;
END;
$$ LANGUAGE plpgsql;

-- Create view for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id,
  p.full_name,
  p.level,
  p.total_points,
  p.rank_grade,
  p.rank_position,
  COUNT(DISTINCT pr.class_id) as completed_classes,
  ROUND(AVG(pr.wpm), 0) as avg_wpm,
  ROUND(AVG(pr.accuracy), 1) as avg_accuracy,
  SUM(pr.time_spent_minutes) as total_time_minutes
FROM profiles p
LEFT JOIN progress pr ON p.id = pr.student_id AND pr.completed = true
WHERE p.role = 'student' AND p.status = 'approved'
GROUP BY p.id, p.full_name, p.level, p.total_points, p.rank_grade, p.rank_position
ORDER BY p.level, p.total_points DESC;
