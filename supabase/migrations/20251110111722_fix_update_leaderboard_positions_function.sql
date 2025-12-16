/*
  # Fix update_leaderboard_positions function

  1. Changes
    - Fix function to use correct column names from user_rankings table
    - Use total_points instead of total_score
    - Update overall_position and category_position correctly
    - Calculate rank_grade and rank_category based on points
    - Assign theme based on overall position

  2. Security
    - Maintain SECURITY DEFINER for proper execution
*/

CREATE OR REPLACE FUNCTION update_leaderboard_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update overall positions and themes
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) as position,
      CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) = 1 THEN 'gold'
        WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) = 2 THEN 'silver'
        WHEN ROW_NUMBER() OVER (ORDER BY total_points DESC, average_wpm DESC) = 3 THEN 'bronze'
        ELSE 'standard'
      END as theme,
      CASE
        WHEN total_points >= 10000 THEN 'S-Rank'
        WHEN total_points >= 7500 THEN 'A-Rank'
        WHEN total_points >= 5000 THEN 'B-Rank'
        WHEN total_points >= 2500 THEN 'C-Rank'
        ELSE 'D-Rank'
      END as rank_grade,
      CASE
        WHEN total_points >= 5000 THEN 'Expert'
        WHEN total_points >= 2500 THEN 'Advanced'
        WHEN total_points >= 1000 THEN 'Intermediate'
        ELSE 'Beginner'
      END as rank_category
    FROM user_rankings
  )
  UPDATE user_rankings ur
  SET 
    overall_position = ru.position,
    theme = ru.theme,
    rank_grade = ru.rank_grade,
    rank_category = ru.rank_category,
    updated_at = now()
  FROM ranked_users ru
  WHERE ur.user_id = ru.user_id;

  -- Update category positions
  WITH category_ranked AS (
    SELECT 
      user_id,
      rank_category,
      ROW_NUMBER() OVER (PARTITION BY rank_category ORDER BY total_points DESC, average_wpm DESC) as cat_position
    FROM user_rankings
  )
  UPDATE user_rankings ur
  SET category_position = cr.cat_position
  FROM category_ranked cr
  WHERE ur.user_id = cr.user_id;
END;
$$;