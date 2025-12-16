/*
  # Add backspace_enabled column to classes table

  1. Changes
    - Add `backspace_enabled` column to `classes` table
    - Column type: boolean
    - Default value: true (backspace enabled by default)
    - Allows admin to control whether students can use backspace in lessons
  
  2. Purpose
    - Gives instructors control over lesson difficulty
    - When disabled, students cannot correct mistakes during typing
    - Enhances typing discipline and accuracy training
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'backspace_enabled'
  ) THEN
    ALTER TABLE classes ADD COLUMN backspace_enabled boolean DEFAULT true;
  END IF;
END $$;