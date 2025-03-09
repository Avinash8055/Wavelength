/*
  # Storage Setup for Media Files

  1. Storage Configuration
    - Create public bucket for media files
    - Set up security policies for bucket access

  2. Security
    - Enable RLS for storage
    - Add policies for authenticated users
*/

-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Authenticated users can update their media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND auth.uid() = owner);

CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media');