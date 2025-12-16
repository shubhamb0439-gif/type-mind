/*
  # Add Audio URL Support to Classes

  1. Changes
    - Add `audio_url` column to the `classes` table
      - Optional text field to store uploaded audio file URLs
      - For audio_sentence and audio_paragraph modules
      - Can be used instead of AI-generated audio

  2. Notes
    - The content field remains required (stores the transcript/text)
    - Audio URL is optional - can use either uploaded audio or AI-generated
    - No changes to existing data or RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE classes ADD COLUMN audio_url text;
  END IF;
END $$;
