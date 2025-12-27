import { create } from 'zustand';
import type { Playlist } from '@/types/playlist.types';
import type { PlaylistWithTracks } from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import type { TrackWithPosition } from '@/types/track.types';
import type { PlaylistInput } from '@utils/validators';
import { playlistApi } from '@api/playlistApi';

/**
 * Playlist State Interface
 */
interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: PlaylistWithTracks | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlaylists: (userId: string) => Promise<void>;
  fetchPlaylistById: (id: string) => Promise<void>;
  createPlaylist: (userId: string, data: PlaylistInput) => Promise<void>;
  updatePlaylist: (id: string, data: Partial<PlaylistInput>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrack: (playlistId: string, track: Track) => Promise<void>;
  removeTrack: (playlistId: string, trackId: string) => Promise<void>;
  reorderTracks: (playlistId: string, trackIds: string[]) => Promise<void>;

  addTrackLocally: (playlistId: string, track: TrackWithPosition) => void;
  removeTrackLocally: (playlistId: string, trackId: string) => void;

  // Error handling
  clearError: () => void;
  clearCurrentPlaylist: () => void;
}

/**
 * Playlist Store
 * Manages playlist state with real API calls
 */
export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  // Initial state
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,

  /**
   * Fetch playlists for the current user
   */
  fetchPlaylists: async () => {
    set({ isLoading: true, error: null });

    try {
      const playlists = await playlistApi.fetchPlaylists();

      set({
        playlists,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch playlists';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch playlist by ID with full track data
   */
  fetchPlaylistById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const playlist = await playlistApi.fetchPlaylistById(id);

      set({
        currentPlaylist: playlist,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch playlist';
      set({
        error: errorMessage,
        isLoading: false,
        currentPlaylist: null,
      });
      throw error;
    }
  },

  /**
   * Create new playlist
   */
  createPlaylist: async (userId: string, data: PlaylistInput) => {
    set({ isLoading: true, error: null });

    try {
      const newPlaylist = await playlistApi.createPlaylist(data);

      // Update state
      const { playlists } = get();
      set({
        playlists: [newPlaylist, ...playlists],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create playlist';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update playlist
   */
  updatePlaylist: async (id: string, data: Partial<PlaylistInput>) => {
    set({ isLoading: true, error: null });

    try {
      const updatedPlaylist = await playlistApi.updatePlaylist(id, data);

      // Update state
      const { playlists, currentPlaylist } = get();

      const updatedCurrentPlaylist =
        currentPlaylist?.id === id
          ? {
              ...currentPlaylist,
              name: updatedPlaylist.name,
              description: updatedPlaylist.description,
              coverUrl: updatedPlaylist.coverUrl,
              visibility: updatedPlaylist.visibility,
              collaboratorIds: updatedPlaylist.collaboratorIds,
              viewerIds: updatedPlaylist.viewerIds,
              trackCount: updatedPlaylist.trackCount,
              updatedAt: updatedPlaylist.updatedAt,
            }
          : currentPlaylist;

      set({
        playlists: playlists.map(p => (p.id === id ? updatedPlaylist : p)),
        currentPlaylist: updatedCurrentPlaylist,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update playlist';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Delete playlist
   */
  deletePlaylist: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await playlistApi.deletePlaylist(id);

      // Update state
      const { playlists, currentPlaylist } = get();
      set({
        playlists: playlists.filter(p => p.id !== id),
        currentPlaylist: currentPlaylist?.id === id ? null : currentPlaylist,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete playlist';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Add track to playlist
   */
  addTrack: async (playlistId: string, track: Track) => {
    set({ isLoading: true, error: null });

    try {
      await playlistApi.addTrack(playlistId, track);

      // Note: Removed fetchPlaylistById call to avoid race condition
      // PlaylistDetailScreen will refresh automatically via useFocusEffect

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add track';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Remove track from playlist
   */
  removeTrack: async (playlistId: string, trackId: string) => {
    set({ isLoading: true, error: null });

    try {
      await playlistApi.removeTrack(playlistId, trackId);

      // Refresh current playlist if it's the one being modified
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        await get().fetchPlaylistById(playlistId);
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove track';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Reorder tracks in playlist
   */
  reorderTracks: async (playlistId: string, trackIds: string[]) => {
    set({ isLoading: true, error: null });

    try {
      await playlistApi.reorderTracks(playlistId, trackIds);

      // Refresh current playlist if it's the one being modified
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        await get().fetchPlaylistById(playlistId);
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder tracks';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Add track locally (for realtime updates without API call)
   */
  addTrackLocally: (playlistId: string, track: TrackWithPosition) => {
    const { currentPlaylist } = get();
    if (currentPlaylist?.id === playlistId) {
      const trackExists = currentPlaylist.tracks.some(t => t.id === track.id);
      if (!trackExists) {
        set({
          currentPlaylist: {
            ...currentPlaylist,
            tracks: [...currentPlaylist.tracks, track],
          },
        });
      }
    }
  },

  /**
   * Remove track locally (for realtime updates without API call)
   */
  removeTrackLocally: (playlistId: string, trackId: string) => {
    const { currentPlaylist } = get();
    if (currentPlaylist?.id === playlistId) {
      set({
        currentPlaylist: {
          ...currentPlaylist,
          tracks: currentPlaylist.tracks.filter(t => t.id !== trackId),
        },
      });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear current playlist
   */
  clearCurrentPlaylist: () => {
    set({ currentPlaylist: null });
  },
}));
