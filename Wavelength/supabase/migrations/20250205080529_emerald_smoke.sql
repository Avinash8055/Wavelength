/*
  # Media Library Schema

  1. New Tables
    - `playlists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, foreign key)
      - `type` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `media_files`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text)
      - `url` (text)
      - `size` (text)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `playlist_items`
      - `id` (uuid, primary key)
      - `playlist_id` (uuid, foreign key)
      - `media_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `recent_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `query` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create playlists table
CREATE TABLE playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('audio', 'video')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create media_files table
CREATE TABLE media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('audio', 'video')),
  url text NOT NULL,
  size text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create playlist_items table
CREATE TABLE playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  media_id uuid REFERENCES media_files(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, media_id)
);

-- Create recent_searches table
CREATE TABLE recent_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;

-- Policies for playlists
CREATE POLICY "Users can manage their own playlists"
  ON playlists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for media_files
CREATE POLICY "Users can manage their own media files"
  ON media_files
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for playlist_items
CREATE POLICY "Users can manage their playlist items"
  ON playlist_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id
      AND user_id = auth.uid()
    )
  );

-- Policies for recent_searches
CREATE POLICY "Users can manage their recent searches"
  ON recent_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update playlist updated_at
CREATE OR REPLACE FUNCTION update_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating playlist updated_at
CREATE TRIGGER update_playlist_timestamp
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_updated_at();