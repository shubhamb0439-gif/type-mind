/*
  # Create TypeMind Audio Storage Bucket

  1. Storage Setup
    - Create 'typemind-audio' bucket for audio lesson files
    - Set bucket as public for easy playback
    - Configure storage policies for upload/delete access

  2. Security
    - Public read access for all authenticated users
    - Upload restricted to TypeMind admins only
    - Delete restricted to TypeMind admins only

  3. Notes
    - Audio files can be accessed via public URLs for playback
    - Only admins can manage audio files
    - Supports both ElevenLabs generated and manually uploaded audio
*/

-- Create storage bucket for TypeMind audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('typemind-audio', 'typemind-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for audio playback
CREATE POLICY "Public read access for TypeMind audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'typemind-audio');

-- Allow TypeMind admins to upload audio files
CREATE POLICY "TypeMind admins can upload audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'typemind-audio'
    AND EXISTS (
      SELECT 1 FROM app_permissions ap
      JOIN apps a ON a.id = ap.app_id
      WHERE ap.employee_id = auth.uid()
      AND a.name = 'Typemind'
      AND EXISTS (
        SELECT 1 FROM employees e
        WHERE e.id = auth.uid()
        AND e.role IN ('admin', 'super_admin')
      )
    )
  );

-- Allow TypeMind admins to update audio files
CREATE POLICY "TypeMind admins can update audio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'typemind-audio'
    AND EXISTS (
      SELECT 1 FROM app_permissions ap
      JOIN apps a ON a.id = ap.app_id
      WHERE ap.employee_id = auth.uid()
      AND a.name = 'Typemind'
      AND EXISTS (
        SELECT 1 FROM employees e
        WHERE e.id = auth.uid()
        AND e.role IN ('admin', 'super_admin')
      )
    )
  );

-- Allow TypeMind admins to delete audio files
CREATE POLICY "TypeMind admins can delete audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'typemind-audio'
    AND EXISTS (
      SELECT 1 FROM app_permissions ap
      JOIN apps a ON a.id = ap.app_id
      WHERE ap.employee_id = auth.uid()
      AND a.name = 'Typemind'
      AND EXISTS (
        SELECT 1 FROM employees e
        WHERE e.id = auth.uid()
        AND e.role IN ('admin', 'super_admin')
      )
    )
  );