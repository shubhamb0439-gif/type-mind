/*
  # Fix Rank Thresholds
  
  Updates rank thresholds to match the correct progression system:
  - D-Rank: 0-299 points
  - C-Rank: 300-499 points
  - B-Rank: 500-699 points
  - A-Rank: 700-899 points
  - S-Rank: 900+ points
*/

-- Update the leaderboard positions function with correct thresholds
CREATE OR REPLACE FUNCTION update_leaderboard_positions()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT
      id,
      user_id,
      total_points,
      average_wpm,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) as position,
      CASE
        WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) = 1 THEN 'gold'
        WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) = 2 THEN 'silver'
        WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) = 3 THEN 'bronze'
        ELSE 'standard'
      END as theme,
      CASE
        WHEN total_points >= 900 THEN 'S-Rank'
        WHEN total_points >= 700 THEN 'A-Rank'
        WHEN total_points >= 500 THEN 'B-Rank'
        WHEN total_points >= 300 THEN 'C-Rank'
        ELSE 'D-Rank'
      END as rank_grade,
      CASE
        WHEN total_points >= 900 THEN 'Master'
        WHEN total_points >= 700 THEN 'Expert'
        WHEN total_points >= 500 THEN 'Advanced'
        WHEN total_points >= 300 THEN 'Intermediate'
        ELSE 'Beginner'
      END as rank_category
    FROM user_rankings
  ),
  category_ranks AS (
    SELECT
      user_id,
      ROW_NUMBER() OVER (PARTITION BY rank_category ORDER BY total_points DESC, average_wpm DESC) as category_position
    FROM ranked_users
  )
  UPDATE user_rankings ur
  SET
    overall_position = ru.position,
    theme = ru.theme,
    rank_grade = ru.rank_grade,
    rank_category = ru.rank_category,
    category_position = cr.category_position,
    updated_at = now()
  FROM ranked_users ru
  JOIN category_ranks cr ON cr.user_id = ru.user_id
  WHERE ur.id = ru.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function with correct thresholds
CREATE OR REPLACE FUNCTION update_user_ranking()
RETURNS TRIGGER AS $$
DECLARE
  v_total_points integer;
  v_total_time_hours numeric;
  v_avg_wpm numeric;
  v_avg_accuracy numeric;
  v_rank_grade text;
  v_rank_category text;
BEGIN
  SELECT
    COALESCE(SUM(score), 0),
    COALESCE(SUM(time_spent), 0) / 3600.0,
    COALESCE(AVG(wpm), 0),
    COALESCE(AVG(accuracy), 0)
  INTO v_total_points, v_total_time_hours, v_avg_wpm, v_avg_accuracy
  FROM lesson_completions
  WHERE user_id = NEW.user_id;

  v_rank_grade := CASE
    WHEN v_total_points >= 900 THEN 'S-Rank'
    WHEN v_total_points >= 700 THEN 'A-Rank'
    WHEN v_total_points >= 500 THEN 'B-Rank'
    WHEN v_total_points >= 300 THEN 'C-Rank'
    ELSE 'D-Rank'
  END;

  v_rank_category := CASE
    WHEN v_total_points >= 900 THEN 'Master'
    WHEN v_total_points >= 700 THEN 'Expert'
    WHEN v_total_points >= 500 THEN 'Advanced'
    WHEN v_total_points >= 300 THEN 'Intermediate'
    ELSE 'Beginner'
  END;

  INSERT INTO user_rankings (
    user_id,
    total_points,
    total_time_hours,
    average_wpm,
    average_accuracy,
    rank_grade,
    rank_category
  ) VALUES (
    NEW.user_id,
    v_total_points,
    v_total_time_hours,
    v_avg_wpm,
    v_avg_accuracy,
    v_rank_grade,
    v_rank_category
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = v_total_points,
    total_time_hours = v_total_time_hours,
    average_wpm = v_avg_wpm,
    average_accuracy = v_avg_accuracy,
    rank_grade = v_rank_grade,
    rank_category = v_rank_category,
    updated_at = now();

  PERFORM update_leaderboard_positions();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate all rankings with new thresholds
SELECT update_leaderboard_positions();
