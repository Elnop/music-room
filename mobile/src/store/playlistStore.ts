import { create } from 'zustand';
import type { Playlist } from '@/types/playlist.types';
import type { PlaylistWithTracks } from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import type { TrackWithPosition } from '@/types/track.types';
import type { PlaylistInput } from '@utils/validators';
import { playlistApi } from '@api/playlistApi';

/**
 * Playlist State Interface
 * Uses stale-while-revalidate pattern for better UX
 */
interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: PlaylistWithTracks | null;
  /** Cache of individual playlists by ID for instant navigation */
  playlistsCache: Map<string, PlaylistWithTracks>;
  /** True only when loading with NO cached data */
  isLoading: boolean;
  /** True when refreshing in background (with existing data) */
  isRefreshing: boolean;
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
  playlistsCache: new Map(),
  isLoading: false,
  isRefreshing: false,
  error: null,

  /**
   * Fetch playlists for the current user
   * Uses stale-while-revalidate: shows cached data immediately, refreshes in background
   */
  fetchPlaylists: async () => {
    const { playlists } = get();
    const hasCache = playlists.length > 0;

    // Only show loading spinner if we have no cached data
    if (!hasCache) {
      set({ isLoading: true, error: null });
    } else {
      set({ isRefreshing: true, error: null });
    }

    try {
      const fetchedPlaylists = await playlistApi.fetchPlaylists();

      set({
        playlists: fetchedPlaylists,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch playlists';
      set({
        error: errorMessage,
        isLoading: false,
        isRefreshing: false,
      });
      throw error;
    }
  },

  /**
   * Fetch playlist by ID with full track data
   * Uses stale-while-revalidate: shows cached data immediately, refreshes in background
   */
  fetchPlaylistById: async (id: string) => {
    const { playlistsCache, currentPlaylist } = get();
    const cachedPlaylist = playlistsCache.get(id);
    const isCurrentPlaylistSameId = currentPlaylist?.id === id;
    const hasCache = cachedPlaylist !== undefined || isCurrentPlaylistSameId;

    // If navigating to a different playlist
    if (!isCurrentPlaylistSameId) {
      if (cachedPlaylist) {
        // We have cache for this playlist - show it immediately
        set({ currentPlaylist: cachedPlaylist, isRefreshing: true, error: null });
      } else {
        // No cache for this playlist - clear current and show loader
        set({ currentPlaylist: null, isLoading: true, error: null });
      }
    } else {
      // Same playlist - just refresh in background
      set({ isRefreshing: true, error: null });
    }

    try {
      const playlist = await playlistApi.fetchPlaylistById(id);

      // Update cache and current playlist
      const newCache = new Map(get().playlistsCache);
      newCache.set(id, playlist);

      set({
        currentPlaylist: playlist,
        playlistsCache: newCache,
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch playlist';
      // Only clear currentPlaylist if we had no cache
      if (!hasCache) {
        set({
          error: errorMessage,
          isLoading: false,
          isRefreshing: false,
          currentPlaylist: null,
        });
      } else {
        set({
          error: errorMessage,
          isLoading: false,
          isRefreshing: false,
        });
      }
      throw error;
    }
  },

  /**
   * Create new playlist
   */
  createPlaylist: async (userId: string, data: PlaylistInput) => {
    set({ error: null });

    try {
      const newPlaylist = await playlistApi.createPlaylist(data);

      // Update state
      const { playlists } = get();
      set({
        playlists: [newPlaylist, ...playlists],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create playlist';
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Update playlist
   */
  updatePlaylist: async (id: string, data: Partial<PlaylistInput>) => {
    set({ error: null });

    try {
      const updatedPlaylist = await playlistApi.updatePlaylist(id, data);

      // Update state and cache
      const { playlists, currentPlaylist, playlistsCache } = get();

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

      // Update cache if this playlist is cached
      const newCache = new Map(playlistsCache);
      if (newCache.has(id) && updatedCurrentPlaylist) {
        newCache.set(id, updatedCurrentPlaylist);
      }

      set({
        playlists: playlists.map(p => (p.id === id ? updatedPlaylist : p)),
        currentPlaylist: updatedCurrentPlaylist,
        playlistsCache: newCache,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update playlist';
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete playlist
   */
  deletePlaylist: async (id: string) => {
    set({ error: null });

    try {
      await playlistApi.deletePlaylist(id);

      // Update state and remove from cache
      const { playlists, currentPlaylist, playlistsCache } = get();
      const newCache = new Map(playlistsCache);
      newCache.delete(id);

      set({
        playlists: playlists.filter(p => p.id !== id),
        currentPlaylist: currentPlaylist?.id === id ? null : currentPlaylist,
        playlistsCache: newCache,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete playlist';
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Add track to playlist
   * Does not trigger loading state - the UI button handles its own loading
   */
  addTrack: async (playlistId: string, track: Track) => {
    set({ error: null });

    try {
      await playlistApi.addTrack(playlistId, track);

      // Note: Removed fetchPlaylistById call to avoid race condition
      // PlaylistDetailScreen will refresh automatically via useFocusEffect
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add track';
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Remove track from playlist
   * Optimistically removes the track from UI immediately
   */
  removeTrack: async (playlistId: string, trackId: string) => {
    const { currentPlaylist, playlistsCache } = get();
    set({ error: null });

    // Optimistic update - remove track immediately from UI
    if (currentPlaylist?.id === playlistId) {
      const updatedPlaylist = {
        ...currentPlaylist,
        tracks: currentPlaylist.tracks.filter(t => t.id !== trackId),
      };
      const newCache = new Map(playlistsCache);
      newCache.set(playlistId, updatedPlaylist);
      set({ currentPlaylist: updatedPlaylist, playlistsCache: newCache });
    }

    try {
      await playlistApi.removeTrack(playlistId, trackId);

      // Silently refresh to sync with server (no loading state)
      const playlist = await playlistApi.fetchPlaylistById(playlistId);
      const newCache = new Map(get().playlistsCache);
      newCache.set(playlistId, playlist);

      if (get().currentPlaylist?.id === playlistId) {
        set({ currentPlaylist: playlist, playlistsCache: newCache });
      } else {
        set({ playlistsCache: newCache });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove track';
      set({ error: errorMessage });
      // Revert optimistic update on error by refreshing
      if (currentPlaylist?.id === playlistId) {
        try {
          const playlist = await playlistApi.fetchPlaylistById(playlistId);
          const newCache = new Map(get().playlistsCache);
          newCache.set(playlistId, playlist);
          set({ currentPlaylist: playlist, playlistsCache: newCache });
        } catch {
          // Ignore refresh error
        }
      }
      throw error;
    }
  },

  /**
   * Reorder tracks in playlist
   */
  reorderTracks: async (playlistId: string, trackIds: string[]) => {
    set({ error: null });

    try {
      await playlistApi.reorderTracks(playlistId, trackIds);

      // Silently refresh current playlist if it's the one being modified
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        const playlist = await playlistApi.fetchPlaylistById(playlistId);
        const newCache = new Map(get().playlistsCache);
        newCache.set(playlistId, playlist);
        set({ currentPlaylist: playlist, playlistsCache: newCache });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder tracks';
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Add track locally (for realtime updates without API call)
   */
  addTrackLocally: (playlistId: string, track: TrackWithPosition) => {
    const { currentPlaylist, playlistsCache } = get();
    if (currentPlaylist?.id === playlistId) {
      const trackExists = currentPlaylist.tracks.some(t => t.id === track.id);
      if (!trackExists) {
        const updatedPlaylist = {
          ...currentPlaylist,
          tracks: [...currentPlaylist.tracks, track],
        };
        const newCache = new Map(playlistsCache);
        newCache.set(playlistId, updatedPlaylist);
        set({
          currentPlaylist: updatedPlaylist,
          playlistsCache: newCache,
        });
      }
    }
  },

  /**
   * Remove track locally (for realtime updates without API call)
   */
  removeTrackLocally: (playlistId: string, trackId: string) => {
    const { currentPlaylist, playlistsCache } = get();
    if (currentPlaylist?.id === playlistId) {
      const updatedPlaylist = {
        ...currentPlaylist,
        tracks: currentPlaylist.tracks.filter(t => t.id !== trackId),
      };
      const newCache = new Map(playlistsCache);
      newCache.set(playlistId, updatedPlaylist);
      set({
        currentPlaylist: updatedPlaylist,
        playlistsCache: newCache,
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
