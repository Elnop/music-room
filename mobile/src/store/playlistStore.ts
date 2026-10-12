import { create } from 'zustand';
import type { Playlist, PlaylistUpdatedEvent, PlaylistWithTracks } from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import type { PlaylistInput } from '@utils/validators';
import { playlistApi } from '@api/playlistApi';
import { ApiError } from '@/services/api';
import { applyPlaylistEvent as applyEvent, sortByRank } from '@/store/playlistSync';

/** Refusals of a move that mean the track changed under us: reload and tell the user. */
export const CONFLICT_CODES = [
	'TRACK_MOVED_CONCURRENTLY',
	'TRACK_NOT_IN_PLAYLIST',
	'PLAYLIST_REBALANCED',
];

export const CONFLICT_MESSAGE = 'This track was changed by someone else';

// Moves from this client go one at a time: each one is sent with the version the
// previous one returned, so a quick second move is never refused against ourselves.
let moveQueue: Promise<unknown> = Promise.resolve();

// Reload the playlist if it is still the one on screen (never switch to it). A failed
// reload is stored in `error` by fetchPlaylistById and is not rethrown.
async function reloadQuietly(get: () => PlaylistState, playlistId: string): Promise<void> {
	if (get().currentPlaylist?.id !== playlistId) return;
	await get()
		.fetchPlaylistById(playlistId)
		.catch(() => undefined);
}

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
	/** Moves sent or queued and not answered yet. */
	pendingMoves: number;
	/** Set when a move was refused because someone else changed the track. */
	conflictMessage: string | null;

	// Actions
	fetchPlaylists: (userId: string) => Promise<void>;
	fetchPlaylistById: (id: string) => Promise<void>;
	createPlaylist: (userId: string, data: PlaylistInput) => Promise<void>;
	updatePlaylist: (id: string, data: Partial<PlaylistInput>) => Promise<void>;
	deletePlaylist: (id: string) => Promise<void>;
	addTrack: (playlistId: string, track: Track) => Promise<void>;
	removeTrack: (playlistId: string, trackId: string) => Promise<void>;
	/**
	 * Rejects with the ApiError on a refusal; on a conflict, reloads first.
	 * Resolves 'skipped' (nothing sent) when the playlist is no longer open.
	 */
	moveTrack: (
		playlistId: string,
		trackId: string,
		afterRank: string | null
	) => Promise<'moved' | 'skipped'>;
	/** Applies a `playlist:updated` delta to the current playlist; 'reload' asks the caller to refetch. */
	applyPlaylistEvent: (event: PlaylistUpdatedEvent) => 'applied' | 'ignored' | 'reload';

	// Error handling
	clearError: () => void;
	clearConflictMessage: () => void;
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
	pendingMoves: 0,
	conflictMessage: null,

	/**
	 * Fetch playlists for the current user
	 * Uses stale-while-revalidate: shows cached data immediately, refreshes in background
	 */
	fetchPlaylists: async () => {
		const { playlists } = get();
		const hasCache = playlists.length > 0;

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

		if (!isCurrentPlaylistSameId) {
			if (cachedPlaylist) {
				set({ currentPlaylist: cachedPlaylist, isRefreshing: true, error: null });
			} else {
				set({ currentPlaylist: null, isLoading: true, error: null });
			}
		} else {
			set({ isRefreshing: true, error: null });
		}

		try {
			const fetched = await playlistApi.fetchPlaylistById(id);
			// An event applied while the request was in flight may be newer than the answer.
			const shown = get().currentPlaylist;
			const playlist =
				shown?.id === id && shown.tracksVersion > fetched.tracksVersion
					? { ...fetched, tracks: shown.tracks, tracksVersion: shown.tracksVersion }
					: { ...fetched, tracks: sortByRank(fetched.tracks) };

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
			const result = await playlistApi.addTrack(playlistId, track);
			const outcome = get().applyPlaylistEvent({
				playlistId,
				tracksVersion: result.tracksVersion,
				rebalanced: result.rebalanced,
				event: 'track_added',
				track: result.track,
			});
			if (outcome === 'reload') await reloadQuietly(get, playlistId);
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
			const result = await playlistApi.removeTrack(playlistId, trackId);
			// The track is already gone locally: the event only advances the version.
			const outcome = get().applyPlaylistEvent({
				playlistId,
				tracksVersion: result.tracksVersion,
				rebalanced: false,
				event: 'track_removed',
				trackId,
			});
			if (outcome === 'reload') await reloadQuietly(get, playlistId);
		} catch (error) {
			// Bring the optimistically removed track back from the server.
			await reloadQuietly(get, playlistId);
			const errorMessage = error instanceof Error ? error.message : 'Failed to remove track';
			set({ error: errorMessage });
			throw error;
		}
	},

	/**
	 * Move a track right after afterRank (null = top). Queued behind the previous
	 * move so it carries the version that move returned.
	 */
	moveTrack: (playlistId: string, trackId: string, afterRank: string | null) => {
		const run = async (): Promise<'moved' | 'skipped'> => {
			try {
				const playlist = get().currentPlaylist;
				if (playlist?.id !== playlistId) return 'skipped';
				const result = await playlistApi.moveTrack(
					playlistId,
					trackId,
					afterRank,
					playlist.tracksVersion
				);
				const outcome = get().applyPlaylistEvent({
					playlistId,
					tracksVersion: result.tracksVersion,
					rebalanced: result.rebalanced,
					event: 'track_moved',
					trackId,
					rank: result.rank,
				});
				if (outcome === 'reload') await reloadQuietly(get, playlistId);
				return 'moved';
			} catch (error) {
				if (error instanceof ApiError && CONFLICT_CODES.includes(error.code)) {
					await reloadQuietly(get, playlistId);
					// Only tell the user if they are still looking at this playlist.
					if (get().currentPlaylist?.id === playlistId) {
						set({ conflictMessage: CONFLICT_MESSAGE });
					}
				} else {
					set({ error: error instanceof Error ? error.message : 'Failed to move track' });
				}
				throw error;
			} finally {
				set(state => ({ pendingMoves: state.pendingMoves - 1 }));
			}
		};
		set(state => ({ pendingMoves: state.pendingMoves + 1 }));
		const next = moveQueue.then(run, run);
		moveQueue = next.catch(() => undefined);
		return next;
	},

	/**
	 * Apply a track event (socket delta or our own HTTP answer) in version order.
	 */
	applyPlaylistEvent: (event: PlaylistUpdatedEvent) => {
		const { currentPlaylist, playlistsCache } = get();
		if (currentPlaylist?.id !== event.playlistId) return 'ignored';
		const next = applyEvent(currentPlaylist, event);
		if (next === 'ignore') return 'ignored';
		if (next === 'reload') return 'reload';
		const newCache = new Map(playlistsCache);
		newCache.set(next.id, next);
		set({ currentPlaylist: next, playlistsCache: newCache });
		return 'applied';
	},

	/**
	 * Clear error message
	 */
	clearError: () => {
		set({ error: null });
	},

	/**
	 * Clear the conflict message once shown
	 */
	clearConflictMessage: () => {
		set({ conflictMessage: null });
	},

	/**
	 * Clear current playlist
	 */
	clearCurrentPlaylist: () => {
		set({ currentPlaylist: null, conflictMessage: null });
	},
}));
