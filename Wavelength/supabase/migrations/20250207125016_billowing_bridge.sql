/*
  # Add playlist cover and ordering functionality

  1. Schema Updates
    - Add cover_url to playlists table
    - Add position to playlist_items table
    - Add function for reordering playlist items

  2. Changes
    - Add cover_url column to playlists table
    - Add position column to playlist_items table
    - Create reorder function
*/

-- Add cover_url to playlists
ALTER TABLE playlists
ADD COLUMN cover_url text;

-- Add position to playlist_items
ALTER TABLE playlist_items
ADD COLUMN position integer DEFAULT 0;

-- Create function to reorder playlist items
CREATE OR REPLACE FUNCTION reorder_playlist_items(
  p_playlist_id uuid,
  p_item_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_position integer := 0;
  v_item_id uuid;
BEGIN
  FOREACH v_item_id IN ARRAY p_item_ids
  LOOP
    UPDATE playlist_items
    SET position = v_position
    WHERE playlist_id = p_playlist_id
    AND id = v_item_id;
    
    v_position := v_position + 1;
  END LOOP;
END;
$$;