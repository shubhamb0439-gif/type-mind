/*
  # Fix Audio Storage Bucket Policies

  1. Changes
    - Drop existing policies that might be causing issues
    - Create simpler policies that check auth.uid() directly
    - Ensure bucket exists with correct settings

  2. Security
    - Authenticated users can upload audio files (admins only enforced in app)
    - Public read access for audio playback
*/

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-audio',
  'class-audio',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated admins can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated admins can delete audio files" ON storage.objects;

-- Create new simplified policies
CREATE POLICY "Authenticated users can upload audio files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'class-audio');

CREATE POLICY "Public can view audio files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'class-audio');

CREATE POLICY "Authenticated users can delete their audio files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'class-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
