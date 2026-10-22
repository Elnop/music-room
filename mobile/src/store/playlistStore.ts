import { create } from 'zustand';
import type {
	Playlist,
	PlaylistDetailsEvent,
	PlaylistUpdatedEvent,
	PlaylistWithTracks,
} from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import type { PlaylistInput } from '@/shared/utils/validators';
import { playlistApi } from '@/api/playlistApi';
import { ApiError } from '@/shared/services/api';
import { applyPlaylistEvent as applyEvent, sortByRank } from './playlistSync';

/** Refusals of a move that mean the track changed under us: reload and tell the user. */
export const CONFLICT_CODES = [
	'TRACK_MOVED_CONCURRENTLY',
	'TRACK_NOT_IN_PLAYLIST',
	'PLAYLIST_REBALANCED',
];

export const CONFLICT_MESSAGE = "Ce titre a été modifié par quelqu'un d'autre";

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
	/** Resolves with the created playlist, so the caller can open it. */
	createPlaylist: (userId: string, data: PlaylistInput) => Promise<Playlist>;
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
	/** Applies a `playlist:details` event (name, description, visibility, edit mode) everywhere it shows. */
	applyDetails: (details: PlaylistDetailsEvent) => void;
	/** Drops a deleted playlist from the list, the cache and the screen (no request). */
	removePlaylist: (id: string) => void;
	/** Applies a `playlist:updated` delta to the current playlist; 'reload' asks the caller to refetch. */
	applyPlaylistEvent: (event: PlaylistUpdatedEvent) => 'applied' | 'ignored' | 'reload';

	// Error handling
	clearConflictMessage: () => void;
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
			const errorMessage =
				error instanceof Error ? error.message : 'Impossible de charger les playlists';
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
			const errorMessage =
				error instanceof Error ? error.message : 'Impossible de charger la playlist';
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
			return newPlaylist;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Impossible de créer la playlist';
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
							editMode: updatedPlaylist.editMode,
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
			const errorMessage =
				error instanceof Error ? error.message : 'Impossible de modifier la playlist';
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
			get().removePlaylist(id);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Impossible de supprimer la playlist';
			set({ error: errorMessage });
			throw error;
		}
	},

	/**
	 * Apply new metadata from a `playlist:details` event (#342). Tracks and
	 * tracksVersion are left alone: they only follow `playlist:updated`.
	 */
	applyDetails: (details: PlaylistDetailsEvent) => {
		const id = details.playlistId;
		// Explicit fields: an absent description means it was cleared.
		const patch = {
			name: details.name,
			description: details.description,
			visibility: details.visibility,
			editMode: details.editMode,
		};
		const { playlists, currentPlaylist, playlistsCache } = get();

		const newCache = new Map(playlistsCache);
		const cached = newCache.get(id);
		if (cached) newCache.set(id, { ...cached, ...patch });

		set({
			playlists: playlists.map(p => (p.id === id ? { ...p, ...patch } : p)),
			currentPlaylist:
				currentPlaylist?.id === id ? { ...currentPlaylist, ...patch } : currentPlaylist,
			playlistsCache: newCache,
		});
	},

	/**
	 * Forget a deleted playlist locally: list, cache and the open screen.
	 */
	removePlaylist: (id: string) => {
		const { playlists, currentPlaylist, playlistsCache } = get();
		const newCache = new Map(playlistsCache);
		newCache.delete(id);

		set({
			playlists: playlists.filter(p => p.id !== id),
			currentPlaylist: currentPlaylist?.id === id ? null : currentPlaylist,
			playlistsCache: newCache,
		});
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
			const errorMessage = error instanceof Error ? error.message : "Impossible d'ajouter le titre";
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
			const errorMessage =
				error instanceof Error ? error.message : 'Impossible de retirer le titre';
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
					set({
						error: error instanceof Error ? error.message : 'Impossible de déplacer le titre',
					});
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
	 * Clear the conflict message once shown
	 */
	clearConflictMessage: () => {
		set({ conflictMessage: null });
	},
}));
