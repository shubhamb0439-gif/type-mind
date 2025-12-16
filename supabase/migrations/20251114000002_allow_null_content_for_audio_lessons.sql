/*
  # Allow NULL Content for Audio Lessons

  1. Changes
    - Modify `content` column in `classes` table to allow NULL values
    - This enables audio lessons to be created without transcripts when audio is uploaded
    - Text typing lessons and AI-generated audio lessons still require content

  2. Notes
    - Application logic handles validation (content required for text lessons and AI audio)
    - When content is NULL, students rely entirely on uploaded audio
*/

ALTER TABLE classes ALTER COLUMN content DROP NOT NULL;
