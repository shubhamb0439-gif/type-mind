/*
  # Create Storage Bucket for Audio Files

  1. New Storage Bucket
    - Create `class-audio` bucket for storing uploaded audio files
    - Enable public access for audio playback
    - Set file size limits and allowed MIME types

  2. Security
    - Only authenticated admins can upload files
    - Public read access for all users (for playback)
    - File size limited to 50MB
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-audio',
  'class-audio',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated admins can upload audio files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'class-audio' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Anyone can view audio files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'class-audio');

CREATE POLICY "Authenticated admins can delete audio files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'class-audio' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
