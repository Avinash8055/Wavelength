import React, { useState, useEffect, useCallback } from 'react';
import { Music, Video, Play, Plus, ArrowLeft, Upload, Search, X, Trash2 } from 'lucide-react';
import type { MediaType } from './types';
import { AudioPlayer } from './components/AudioPlayer';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { supabase, initializeAuth } from './lib/supabase';
import { uploadMedia, formatFileSize } from './lib/media';
import { createPlaylist, deletePlaylist, fetchUserPlaylists, type PlaylistWithSongs } from './lib/playlists';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'search' | 'upload' | 'playlist' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [uploadType, setUploadType] = useState<'audio' | 'video'>('audio');
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithSongs | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const loadPlaylists = useCallback(async () => {
    const userPlaylists = await fetchUserPlaylists();
    setPlaylists(userPlaylists);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAuth();
        setIsInitialized(true);
        await Promise.all([
          fetchAllSongs(),
          loadPlaylists()
        ]);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };
    initialize();
  }, [loadPlaylists]);

  useEffect(() => {
    if (isInitialized) {
      handleSearch();
    }
  }, [searchQuery, isInitialized]);

  useEffect(() => {
    if (showCreatePlaylistModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreatePlaylistModal]);

  const fetchAllSongs = async () => {
    try {
      const { data: songs, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('type', 'audio')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllSongs(songs || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: songs, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('type', 'audio')
        .ilike('name', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearchResults(songs || []);
    } catch (error) {
      console.error('Error searching songs:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!isInitialized) {
      alert('Please wait for initialization to complete');
      return;
    }
    
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        const file = files[0];
        await uploadMedia(file);
        fetchAllSongs();
        alert('File uploaded successfully!');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePlayFile = (file: any) => {
    setCurrentTrack({
      url: file.url,
      name: file.name,
    });
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || selectedSongs.length === 0) {
      alert('Please enter a playlist name and select songs');
      return;
    }

    setIsCreatingPlaylist(true);
    try {
      await createPlaylist(
        playlistName.trim(),
        'audio',
        selectedSongs.map(song => song.id)
      );
      
      await loadPlaylists();
      setSelectedSongs([]);
      setPlaylistName('');
      setShowCreatePlaylistModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent playlist selection when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      await deletePlaylist(playlistId);
      await loadPlaylists();
      
      // If we're viewing the deleted playlist, go back home
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to delete playlist. Please try again.');
    }
  };

  const handlePlaylistNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaylistName(e.target.value);
  };

  const toggleSongSelection = (song: any) => {
    setSelectedSongs(prev => {
      const isSelected = prev.some(s => s.id === song.id);
      if (isSelected) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const renderLibraryScreen = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Library</h2>
        <button
          onClick={() => setShowCreatePlaylistModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Create Playlist
        </button>
      </div>
      <div className="space-y-2">
        {allSongs.map((song) => (
          <div key={song.id} className="bg-gray-800/90 rounded-xl p-4 hover:bg-gray-700/90 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedSongs.some(s => s.id === song.id)}
                  onChange={() => toggleSongSelection(song)}
                  className="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                />
                <Music size={20} className="text-purple-400" />
                <div>
                  <h4 className="font-semibold text-sm">{song.name}</h4>
                  <p className="text-xs text-gray-400">{formatFileSize(song.size)}</p>
                </div>
              </div>
              <button
                onClick={() => handlePlayFile(song)}
                className="p-2 hover:bg-gray-600/80 rounded-full transition-colors"
              >
                <Play size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSearchScreen = () => (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Search</h2>
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs..."
          className="w-full p-4 pl-12 bg-gray-800/90 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      <div className="space-y-2">
        {searchResults.map((song) => (
          <div key={song.id} className="bg-gray-800/90 rounded-xl p-4 hover:bg-gray-700/90 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Music size={20} className="text-purple-400" />
                <div>
                  <h4 className="font-semibold text-sm">{song.name}</h4>
                  <p className="text-xs text-gray-400">{formatFileSize(song.size)}</p>
                </div>
              </div>
              <button
                onClick={() => handlePlayFile(song)}
                className="p-2 hover:bg-gray-600/80 rounded-full transition-colors"
              >
                <Play size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUploadScreen = () => (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Upload Media</h2>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setUploadType('audio')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all duration-200 ${
            uploadType === 'audio'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-800/90 text-white hover:bg-gray-700/90'
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => setUploadType('video')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all duration-200 ${
            uploadType === 'video'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-800/90 text-white hover:bg-gray-700/90'
          }`}
        >
          Video
        </button>
      </div>
      <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
        <input
          type="file"
          id="media-upload"
          className="hidden"
          accept={uploadType === 'audio' 
            ? ".mp3,.wav,.m4a,.aac,.ogg,.flac,.alac,.aiff"
            : ".mp4,.mov,.wmv,.avi,.mkv,.webm"}
          onChange={handleFileUpload}
        />
        <label
          htmlFor="media-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          {uploadType === 'audio' ? (
            <Music size={48} className="mb-4 text-purple-400" />
          ) : (
            <Video size={48} className="mb-4 text-purple-400" />
          )}
          <p className="text-lg font-semibold mb-2">
            Upload your {uploadType === 'audio' ? 'music' : 'video'}
          </p>
          <p className="text-sm text-gray-400">
            {uploadType === 'audio'
              ? 'Supports MP3, WAV, M4A, AAC, OGG, FLAC, ALAC, AIFF'
              : 'Supports MP4, MOV, WMV, AVI, MKV, WebM'}
          </p>
        </label>
      </div>
    </div>
  );

  const renderHomeScreen = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Wavelength
        </h1>
      </div>
      
      <div className="space-y-2">
        {playlists.map(playlist => (
          <div
            key={playlist.id}
            className="bg-gray-800/90 p-4 rounded-xl cursor-pointer hover:bg-gray-700/90 transition-all duration-200"
            onClick={() => {
              setSelectedPlaylist(playlist);
              setCurrentScreen('playlist');
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Music size={20} className="text-purple-400" />
                <div>
                  <h3 className="font-semibold">{playlist.name}</h3>
                  <p className="text-sm text-gray-400">
                    {playlist.songs.length} songs
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Play size={20} className="text-gray-400" />
                <button
                  onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlaylistScreen = () => {
    if (!selectedPlaylist) return null;
    
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <button
            onClick={(e) => handleDeletePlaylist(selectedPlaylist.id, e)}
            className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
          >
            <Trash2 size={16} />
            <span>Delete Playlist</span>
          </button>
        </div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {selectedPlaylist.name}
          </h2>
          <p className="text-gray-400">
            {selectedPlaylist.songs.length} songs
          </p>
        </div>

        <div className="mt-8">
          <div className="space-y-2">
            {selectedPlaylist.songs.map((song) => (
              <div key={song.id} className="bg-gray-800/90 rounded-xl p-4 hover:bg-gray-700/90 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Music size={20} className="text-purple-400" />
                    <div>
                      <h4 className="font-semibold text-sm">{song.name}</h4>
                      <p className="text-xs text-gray-400">{formatFileSize(song.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayFile(song)}
                    className="p-2 hover:bg-gray-600/80 rounded-full transition-colors"
                  >
                    <Play size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return renderHomeScreen();
      case 'search':
        return renderSearchScreen();
      case 'upload':
        return renderUploadScreen();
      case 'playlist':
        return renderPlaylistScreen();
      case 'library':
        return renderLibraryScreen();
      default:
        return null;
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Initializing...</h2>
          <p className="text-gray-400">Please wait while we set up your account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-32">
      {renderScreen()}
      <AudioPlayer
        currentTrack={currentTrack}
        onNext={() => {
          // Implement next track logic
        }}
        onPrevious={() => {
          // Implement previous track logic
        }}
      />
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800/95 border-t border-gray-700 backdrop-blur-sm">
        <div className="flex justify-around p-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`p-2 transition-colors ${currentScreen === 'home' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            <Music size={24} />
          </button>
          <button
            onClick={() => setCurrentScreen('search')}
            className={`p-2 transition-colors ${currentScreen === 'search' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            <Search size={24} />
          </button>
          <button
            onClick={() => setCurrentScreen('library')}
            className={`p-2 transition-colors ${currentScreen === 'library' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => setCurrentScreen('upload')}
            className={`p-2 transition-colors ${currentScreen === 'upload' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            <Upload size={24} />
          </button>
        </div>
      </nav>
      <CreatePlaylistModal
        show={showCreatePlaylistModal}
        onClose={() => {
          setShowCreatePlaylistModal(false);
          setSelectedSongs([]);
          setPlaylistName('');
        }}
        playlistName={playlistName}
        onPlaylistNameChange={handlePlaylistNameChange}
        selectedSongs={selectedSongs}
        allSongs={allSongs}
        onToggleSong={toggleSongSelection}
        onCreatePlaylist={handleCreatePlaylist}
        isCreating={isCreatingPlaylist}
        inputRef={inputRef}
      />
    </div>
  );
}

export default App;