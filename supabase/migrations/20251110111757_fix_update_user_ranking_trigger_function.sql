/*
  # Fix update_user_ranking trigger function

  1. Changes
    - Fix function to use correct column names from user_rankings table
    - Use total_points instead of total_score
    - Use rank_grade instead of rank_level
    - Use rank_category instead of proficiency_level
    - Remove references to non-existent columns
    - Calculate stats correctly from lesson_completions

  2. Security
    - Maintain SECURITY DEFINER for proper execution
*/

CREATE OR REPLACE FUNCTION update_user_ranking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points integer;
  v_total_time_seconds integer;
  v_avg_accuracy numeric;
  v_avg_wpm numeric;
  v_rank_grade text;
  v_rank_category text;
  v_old_rank_grade text;
BEGIN
  -- Calculate aggregates from lesson completions
  SELECT 
    COALESCE(SUM(CASE WHEN is_first_completion THEN score ELSE 0 END), 0),
    COALESCE(SUM(time_spent), 0),
    COALESCE(AVG(accuracy), 0),
    COALESCE(AVG(wpm), 0)
  INTO v_total_points, v_total_time_seconds, v_avg_accuracy, v_avg_wpm
  FROM lesson_completions
  WHERE user_id = NEW.user_id;

  -- Calculate rank grade based on points
  v_rank_grade := CASE
    WHEN v_total_points >= 10000 THEN 'S-Rank'
    WHEN v_total_points >= 7500 THEN 'A-Rank'
    WHEN v_total_points >= 5000 THEN 'B-Rank'
    WHEN v_total_points >= 2500 THEN 'C-Rank'
    ELSE 'D-Rank'
  END;

  -- Calculate rank category based on points
  v_rank_category := CASE
    WHEN v_total_points >= 5000 THEN 'Expert'
    WHEN v_total_points >= 2500 THEN 'Advanced'
    WHEN v_total_points >= 1000 THEN 'Intermediate'
    ELSE 'Beginner'
  END;

  -- Get old rank for certification check
  SELECT rank_grade INTO v_old_rank_grade
  FROM user_rankings
  WHERE user_id = NEW.user_id;

  -- Insert or update ranking
  INSERT INTO user_rankings (
    user_id,
    total_points,
    total_time_hours,
    average_accuracy,
    average_wpm,
    rank_grade,
    rank_category,
    updated_at
  ) VALUES (
    NEW.user_id,
    v_total_points,
    ROUND((v_total_time_seconds::numeric / 3600), 2),
    ROUND(v_avg_accuracy, 2),
    ROUND(v_avg_wpm, 2),
    v_rank_grade,
    v_rank_category,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = v_total_points,
    total_time_hours = ROUND((v_total_time_seconds::numeric / 3600), 2),
    average_accuracy = ROUND(v_avg_accuracy, 2),
    average_wpm = ROUND(v_avg_wpm, 2),
    rank_grade = v_rank_grade,
    rank_category = v_rank_category,
    updated_at = now();

  -- Issue certificate if rank improved
  IF v_old_rank_grade IS NOT NULL AND v_old_rank_grade != v_rank_grade THEN
    INSERT INTO certifications (user_id, rank_achieved, certificate_data)
    VALUES (NEW.user_id, v_rank_grade, jsonb_build_object(
      'previous_rank', v_old_rank_grade,
      'new_rank', v_rank_grade,
      'total_points', v_total_points,
      'average_wpm', v_avg_wpm,
      'average_accuracy', v_avg_accuracy
    ));
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS update_ranking_after_lesson ON lesson_completions;
CREATE TRIGGER update_ranking_after_lesson
  AFTER INSERT ON lesson_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ranking();