import { supabase } from './supabase';
import type { MediaType } from '../types';

export interface Playlist {
  id: string;
  name: string;
  type: MediaType;
  user_id: string;
  created_at?: string;
}

export interface PlaylistWithSongs extends Playlist {
  songs: any[];
}

export async function createPlaylist(name: string, type: MediaType, songIds: string[]) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // First create the playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .insert({
        name,
        type,
        user_id: user.id
      })
      .select()
      .single();

    if (playlistError) throw playlistError;

    // Then add all songs to the playlist
    const playlistItems = songIds.map((mediaId, index) => ({
      playlist_id: playlist.id,
      media_id: mediaId,
      position: index
    }));

    const { error: itemsError } = await supabase
      .from('playlist_items')
      .insert(playlistItems);

    if (itemsError) throw itemsError;

    return playlist;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

export async function deletePlaylist(playlistId: string) {
  try {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

export async function fetchUserPlaylists(): Promise<PlaylistWithSongs[]> {
  try {
    const { data: playlists, error: playlistsError } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_items (
          media_files (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (playlistsError) throw playlistsError;

    return (playlists || []).map(playlist => ({
      ...playlist,
      songs: playlist.playlist_items?.map((item: any) => item.media_files) || []
    }));
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
}