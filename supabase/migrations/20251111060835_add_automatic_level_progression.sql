/*
  # Automatic Level Progression System
  
  1. Overview
    - Automatically upgrades student profile level based on rank achievements
    - Makes progression challenging - students must practice consistently
    - Syncs rank_category to profile.level in real-time
  
  2. Progression Requirements (TOUGH!)
    - Beginner (D-Rank): 0-299 points → Need 300 points to reach Intermediate
    - Intermediate (C-Rank): 300-499 points → Need 500 points to reach Advanced
    - Advanced (B-Rank+): 500+ points → Elite tier (B/A/S-Rank)
  
  3. System Features
    - Real-time level updates when rank increases
    - Automatic class access unlocking
    - Certification generation at rank milestones
    - Progress tracking toward next level
  
  4. Security
    - Function runs with SECURITY DEFINER (elevated privileges)
    - Updates profile level atomically with ranking changes
*/

-- Function to sync profile level with rank category
CREATE OR REPLACE FUNCTION sync_profile_level_with_rank()
RETURNS TRIGGER AS $$
DECLARE
  v_new_level text;
  v_old_rank_grade text;
BEGIN
  -- Map rank_category to profile level
  v_new_level := CASE NEW.rank_category
    WHEN 'Beginner' THEN 'beginner'
    WHEN 'Intermediate' THEN 'intermediate'
    WHEN 'Advanced' THEN 'advanced'
    WHEN 'Expert' THEN 'advanced'
    WHEN 'Master' THEN 'advanced'
    ELSE 'beginner'
  END;

  -- Get the old rank grade for comparison
  SELECT rank_grade INTO v_old_rank_grade
  FROM user_rankings
  WHERE user_id = NEW.user_id
  AND id != NEW.id;

  -- Update profile level
  UPDATE profiles
  SET 
    level = v_new_level,
    updated_at = now()
  WHERE id = NEW.user_id
  AND level != v_new_level;

  -- If rank changed and is not D-Rank, check if we need to issue a new certificate
  IF v_old_rank_grade IS DISTINCT FROM NEW.rank_grade AND NEW.rank_grade != 'D-Rank' THEN
    -- Check if certificate already exists for this rank
    IF NOT EXISTS (
      SELECT 1 FROM certifications
      WHERE user_id = NEW.user_id
      AND rank_achieved = NEW.rank_grade
    ) THEN
      -- Issue new certificate
      INSERT INTO certifications (
        user_id,
        rank_achieved,
        points_at_issue,
        wpm_at_issue,
        accuracy_at_issue
      ) VALUES (
        NEW.user_id,
        NEW.rank_grade,
        NEW.total_points,
        NEW.average_wpm,
        NEW.average_accuracy
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_level_on_rank_update ON user_rankings;

-- Create trigger to sync level when ranking updates
CREATE TRIGGER sync_level_on_rank_update
  AFTER INSERT OR UPDATE OF rank_category, rank_grade
  ON user_rankings
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_level_with_rank();

-- Sync all existing users' levels with their current ranks
DO $$
DECLARE
  v_user RECORD;
  v_new_level text;
BEGIN
  FOR v_user IN 
    SELECT ur.user_id, ur.rank_category
    FROM user_rankings ur
  LOOP
    v_new_level := CASE v_user.rank_category
      WHEN 'Beginner' THEN 'beginner'
      WHEN 'Intermediate' THEN 'intermediate'
      WHEN 'Advanced' THEN 'advanced'
      WHEN 'Expert' THEN 'advanced'
      WHEN 'Master' THEN 'advanced'
      ELSE 'beginner'
    END;

    UPDATE profiles
    SET 
      level = v_new_level,
      updated_at = now()
    WHERE id = v_user.user_id
    AND level != v_new_level;
  END LOOP;
END $$;
