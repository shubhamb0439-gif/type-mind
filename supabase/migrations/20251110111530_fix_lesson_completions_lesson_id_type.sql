/*
  # Fix lesson_completions.lesson_id type

  1. Changes
    - Change lesson_id column from text to uuid to match classes.id
    - Add foreign key constraint to ensure referential integrity

  2. Security
    - No changes to RLS policies
*/

-- Change lesson_id column type from text to uuid
ALTER TABLE lesson_completions 
  ALTER COLUMN lesson_id TYPE uuid USING lesson_id::uuid;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lesson_completions_lesson_id_fkey'
    AND table_name = 'lesson_completions'
  ) THEN
    ALTER TABLE lesson_completions
      ADD CONSTRAINT lesson_completions_lesson_id_fkey
      FOREIGN KEY (lesson_id)
      REFERENCES classes(id)
      ON DELETE CASCADE;
  END IF;
END $$;