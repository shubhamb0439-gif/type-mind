/*
  # Add Audio Lesson Metadata Fields

  1. Changes
    - Add `transcript` column to store the text version of audio lessons
    - Add `audio_source` column to track whether audio was generated (elevenlabs) or uploaded (manual)
    - Add `voice_id` column to store ElevenLabs voice configuration
    - Add `playback_speed` column to store audio playback speed setting

  2. Security
    - No RLS changes needed (existing policies apply)

  3. Notes
    - `transcript` stores the text used for accuracy scoring when students type
    - For ElevenLabs-generated audio: transcript is the input text
    - For uploaded audio: transcript is generated via automatic transcription
    - `audio_source` values: 'elevenlabs' | 'upload' | NULL (for text lessons)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'transcript'
  ) THEN
    ALTER TABLE classes ADD COLUMN transcript text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'audio_source'
  ) THEN
    ALTER TABLE classes ADD COLUMN audio_source text CHECK (audio_source IN ('elevenlabs', 'upload'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'voice_id'
  ) THEN
    ALTER TABLE classes ADD COLUMN voice_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classes' AND column_name = 'playback_speed'
  ) THEN
    ALTER TABLE classes ADD COLUMN playback_speed numeric DEFAULT 1.0 CHECK (playback_speed >= 0.5 AND playback_speed <= 2.0);
  END IF;
END $$;
