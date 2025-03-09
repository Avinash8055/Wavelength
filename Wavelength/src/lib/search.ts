import { supabase } from './supabase';

export async function searchMedia(query: string) {
  try {
    // Save search query
    await saveSearchQuery(query);

    // First search in media_files table
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media_files')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false });

    if (mediaError) throw mediaError;

    // Then list all files in the songs folder
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('media')
      .list('songs', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (storageError) throw storageError;

    // Filter storage files by query
    const matchingStorageFiles = storageFiles
      .filter(file => file.name.toLowerCase().includes(query.toLowerCase()))
      .map(file => ({
        id: file.id || Math.random().toString(36).substring(2),
        name: file.name,
        type: file.metadata?.mimetype?.startsWith('video/') ? 'video' : 'audio',
        url: supabase.storage.from('media').getPublicUrl(`songs/${file.name}`).data.publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at
      }));

    // Combine and deduplicate results
    const allResults = [...(mediaFiles || []), ...matchingStorageFiles];
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.url, item])).values());

    return uniqueResults;
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
}

export async function saveSearchQuery(query: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('recent_searches')
      .insert({ 
        query,
        user_id: user.id 
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving search query:', error);
  }
}

export async function getRecentSearches() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('recent_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return [];
  }
}

export async function clearRecentSearches() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('recent_searches')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
}