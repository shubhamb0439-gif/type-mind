/*
  # Update Certifications Schema
  
  Adds columns for certificate data display
*/

-- Add missing columns to certifications table
ALTER TABLE certifications 
ADD COLUMN IF NOT EXISTS points_at_issue integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS wpm_at_issue numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS accuracy_at_issue numeric(5,2) DEFAULT 0;

-- Drop the old certificate_data column if it exists
ALTER TABLE certifications DROP COLUMN IF EXISTS certificate_data;

-- Update the certification trigger function
CREATE OR REPLACE FUNCTION issue_rank_certification()
RETURNS TRIGGER AS $$
DECLARE
  old_rank text;
  new_rank text;
  rank_order text[] := ARRAY['D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank'];
  old_rank_pos integer;
  new_rank_pos integer;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_rank := OLD.rank_grade;
    new_rank := NEW.rank_grade;
    
    SELECT array_position(rank_order, old_rank) INTO old_rank_pos;
    SELECT array_position(rank_order, new_rank) INTO new_rank_pos;
    
    IF new_rank_pos > old_rank_pos THEN
      INSERT INTO certifications (
        user_id,
        rank_achieved,
        points_at_issue,
        wpm_at_issue,
        accuracy_at_issue,
        issued_at
      ) VALUES (
        NEW.user_id,
        NEW.rank_grade,
        NEW.total_points,
        NEW.average_wpm,
        NEW.average_accuracy,
        now()
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO certifications (
      user_id,
      rank_achieved,
      points_at_issue,
      wpm_at_issue,
      accuracy_at_issue,
      issued_at
    ) VALUES (
      NEW.user_id,
      NEW.rank_grade,
      NEW.total_points,
      NEW.average_wpm,
      NEW.average_accuracy,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_issue_certification ON user_rankings;
CREATE TRIGGER trigger_issue_certification
  AFTER INSERT OR UPDATE OF rank_grade
  ON user_rankings
  FOR EACH ROW
  EXECUTE FUNCTION issue_rank_certification();

-- Issue certificates for existing users
INSERT INTO certifications (user_id, rank_achieved, points_at_issue, wpm_at_issue, accuracy_at_issue, issued_at)
SELECT user_id, rank_grade, total_points, average_wpm, average_accuracy, now()
FROM user_rankings
WHERE user_id NOT IN (SELECT user_id FROM certifications)
ON CONFLICT DO NOTHING;
