import { create } from 'zustand';
import type { Playlist, PlaylistWithTracks, UserProfile, Track } from '@types';
import type { PlaylistInput } from '@utils/validators';
import {
  getUserPlaylists,
  findPlaylistById,
  getPlaylistTracks,
  createMockPlaylist,
  updateMockPlaylist,
  deleteMockPlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
} from '@mocks';
import { delay, generateId } from '@utils/mockHelpers';
import { findUserById } from '@mocks';

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

  // Error handling
  clearError: () => void;
  clearCurrentPlaylist: () => void;
}

/**
 * Playlist Store
 * Manages playlist state with mock data
 */
export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  // Initial state
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,

  /**
   * Fetch playlists for a user
   */
  fetchPlaylists: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate network delay
      await delay(800);

      // Get user's playlists (owned + collaborating)
      const playlists = getUserPlaylists(userId);

      set({
        playlists,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch playlists';
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
      // Simulate network delay
      await delay(600);

      // Find playlist
      const playlist = findPlaylistById(id);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Get tracks
      const tracks = getPlaylistTracks(id);

      // Get owner info
      const owner = findUserById(playlist.ownerId);
      if (!owner) {
        throw new Error('Playlist owner not found');
      }

      // Build PlaylistWithTracks
      const playlistWithTracks: PlaylistWithTracks = {
        ...playlist,
        tracks,
        owner,
      };

      set({
        currentPlaylist: playlistWithTracks,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch playlist';
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
      // Simulate network delay
      await delay(1000);

      // Create new playlist
      const newPlaylist: Playlist = {
        id: generateId('playlist'),
        name: data.name,
        description: data.description,
        coverUrl: undefined,
        ownerId: userId,
        collaboratorIds: [],
        trackIds: [],
        visibility: data.visibility,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to mock data
      createMockPlaylist(newPlaylist);

      // Update state
      const { playlists } = get();
      set({
        playlists: [...playlists, newPlaylist],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create playlist';
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
      // Simulate network delay
      await delay(600);

      // Update in mock data
      const updatedPlaylist = updateMockPlaylist(id, data);
      if (!updatedPlaylist) {
        throw new Error('Playlist not found');
      }

      // Update state
      const { playlists, currentPlaylist } = get();
      set({
        playlists: playlists.map(p => (p.id === id ? updatedPlaylist : p)),
        currentPlaylist: currentPlaylist?.id === id
          ? { ...currentPlaylist, ...updatedPlaylist }
          : currentPlaylist,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update playlist';
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
      // Simulate network delay
      await delay(500);

      // Delete from mock data
      const success = deleteMockPlaylist(id);
      if (!success) {
        throw new Error('Playlist not found');
      }

      // Update state
      const { playlists, currentPlaylist } = get();
      set({
        playlists: playlists.filter(p => p.id !== id),
        currentPlaylist: currentPlaylist?.id === id ? null : currentPlaylist,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete playlist';
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
      // Simulate network delay
      await delay(400);

      // Add track in mock data (passing full track object)
      const success = addTrackToPlaylist(playlistId, track);
      if (!success) {
        throw new Error('Failed to add track (playlist not found or track already in playlist)');
      }

      // Refresh current playlist if it's the one being modified
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        await get().fetchPlaylistById(playlistId);
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add track';
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
      // Simulate network delay
      await delay(400);

      // Remove track from mock data
      const success = removeTrackFromPlaylist(playlistId, trackId);
      if (!success) {
        throw new Error('Failed to remove track (playlist or track not found)');
      }

      // Refresh current playlist if it's the one being modified
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        await get().fetchPlaylistById(playlistId);
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to remove track';
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
      // Simulate network delay
      await delay(400);

      // Reorder tracks in mock data
      const success = reorderPlaylistTracks(playlistId, trackIds);
      if (!success) {
        throw new Error('Failed to reorder tracks (playlist not found)');
      }

      // Refresh current playlist if it's the one being modified
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        await get().fetchPlaylistById(playlistId);
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reorder tracks';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
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
