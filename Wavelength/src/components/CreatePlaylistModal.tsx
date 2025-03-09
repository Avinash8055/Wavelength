import React from 'react';
import { X, Music } from 'lucide-react';

interface CreatePlaylistModalProps {
  show: boolean;
  onClose: () => void;
  playlistName: string;
  onPlaylistNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedSongs: any[];
  allSongs: any[];
  onToggleSong: (song: any) => void;
  onCreatePlaylist: () => void;
  isCreating: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function CreatePlaylistModal({
  show,
  onClose,
  playlistName,
  onPlaylistNameChange,
  selectedSongs,
  allSongs,
  onToggleSong,
  onCreatePlaylist,
  isCreating,
  inputRef,
}: CreatePlaylistModalProps) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-800/95 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create New Playlist
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter playlist name"
              value={playlistName}
              onChange={onPlaylistNameChange}
              className="w-full p-4 bg-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-600/50 transition-all duration-200"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                Selected songs <span className="ml-2 px-2 py-1 bg-purple-500/20 rounded-full text-purple-300 text-xs">{selectedSongs.length}</span>
              </h4>
              <div className="max-h-48 overflow-y-auto rounded-lg bg-gray-700/30 p-2">
                {selectedSongs.length === 0 ? (
                  <p className="text-sm text-gray-400 p-2">No songs selected</p>
                ) : (
                  <div className="space-y-1">
                    {selectedSongs.map(song => (
                      <div key={song.id} className="flex items-center justify-between p-2 hover:bg-gray-600/50 rounded-lg transition-colors">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Music size={16} className="text-purple-400 flex-shrink-0" />
                          <span className="text-sm truncate">{song.name}</span>
                        </div>
                        <button
                          onClick={() => onToggleSong(song)}
                          className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Available songs</h4>
              <div className="max-h-48 overflow-y-auto rounded-lg bg-gray-700/30 p-2">
                {allSongs.map(song => (
                  <div 
                    key={song.id} 
                    className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                      selectedSongs.some(s => s.id === song.id)
                        ? 'bg-purple-500/20 hover:bg-purple-500/30'
                        : 'hover:bg-gray-600/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Music size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm truncate">{song.name}</span>
                    </div>
                    <button
                      onClick={() => onToggleSong(song)}
                      className={`ml-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                        selectedSongs.some(s => s.id === song.id)
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {selectedSongs.some(s => s.id === song.id) ? 'Selected' : 'Select'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onCreatePlaylist}
            disabled={isCreating || !playlistName.trim() || selectedSongs.length === 0}
            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
              isCreating || !playlistName.trim() || selectedSongs.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>
      </div>
    </div>
  );
}