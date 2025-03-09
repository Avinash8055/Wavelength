import { supabase } from './supabase';

export async function uploadMedia(file: File) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    // Upload to Supabase Storage using original filename
    const filePath = `songs/${file.name}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        upsert: true // Override if file exists
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      throw storageError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { data: mediaData, error: dbError } = await supabase
      .from('media_files')
      .insert({
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'audio',
        url: publicUrl,
        size: Math.round(file.size),
        user_id: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return mediaData;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

export async function deleteMedia(id: string) {
  try {
    // Get the file details first
    const { data: file, error: fetchError } = await supabase
      .from('media_files')
      .select('url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (file) {
      // Extract filename from URL
      const fileName = file.url.split('/').pop();
      if (fileName) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([`songs/${fileName}`]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}