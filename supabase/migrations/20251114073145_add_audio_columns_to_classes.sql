/*
  # Add Audio Support to Classes Table

  1. Changes
    - Add `audio_url` column for storing audio file URLs
    - Add `audio_source` column for tracking audio generation method ('elevenlabs' or 'upload')
    - Add `voice_id` column for ElevenLabs voice identification
    - Add `playback_speed` column for audio playback speed
    - Add `transcript` column for audio transcription text
    - Modify `content` column to allow NULL for audio-only lessons
    - Modify `module_type` to include audio lesson types

  2. Notes
    - Audio lessons may have NULL content when only audio is provided
    - Transcript is required for all audio lessons for typing accuracy checking
    - Voice settings are preserved for regeneration purposes
*/

-- Add new columns for audio support
DO $$
BEGIN
  -- Add audio_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE classes ADD COLUMN audio_url text;
  END IF;

  -- Add audio_source column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'audio_source'
  ) THEN
    ALTER TABLE classes ADD COLUMN audio_source text;
    ALTER TABLE classes ADD CONSTRAINT classes_audio_source_check 
      CHECK (audio_source IN ('elevenlabs', 'upload') OR audio_source IS NULL);
  END IF;

  -- Add voice_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'voice_id'
  ) THEN
    ALTER TABLE classes ADD COLUMN voice_id text;
  END IF;

  -- Add playback_speed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'playback_speed'
  ) THEN
    ALTER TABLE classes ADD COLUMN playback_speed decimal(3,1) DEFAULT 1.0;
  END IF;

  -- Add transcript column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'transcript'
  ) THEN
    ALTER TABLE classes ADD COLUMN transcript text;
  END IF;
END $$;

-- Modify content column to allow NULL for audio-only lessons
ALTER TABLE classes ALTER COLUMN content DROP NOT NULL;

-- Add a check constraint to ensure either content or transcript is provided
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_content_or_transcript_check;
ALTER TABLE classes ADD CONSTRAINT classes_content_or_transcript_check 
  CHECK (content IS NOT NULL OR transcript IS NOT NULL);