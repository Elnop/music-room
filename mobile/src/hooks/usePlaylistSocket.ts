import { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '@store/socketStore';
import { usePlaylistStore } from '@store/playlistStore';
import type {
	PlaylistDeletedEvent,
	PlaylistDetailsEvent,
	PlaylistUpdatedEvent,
} from '@/types/playlist.types';

/**
 * Hook for real-time playlist updates
 *
 * Joins the playlist room on mount, leaves on unmount. Each `playlist:updated`
 * delta goes through the store, which applies it in version order; a skipped
 * version or a rebalance reloads the playlist (doc/PLAYLIST_CONCURRENCY.md).
 * Re-joining after a reconnect reloads too, since events sent while
 * disconnected are lost; the first join relies on the screen's own load.
 *
 * `playlist:details` (name, description, visibility, edit mode) patches the
 * store; `playlist:deleted` drops the playlist from it and sets `deleted`, so
 * the screen can tell the user and leave (#342).
 *
 * @param playlistId - The playlist ID to watch
 */
export function usePlaylistSocket(playlistId: string) {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const applyPlaylistEvent = usePlaylistStore(state => state.applyPlaylistEvent);
	const fetchPlaylistById = usePlaylistStore(state => state.fetchPlaylistById);
	const applyDetails = usePlaylistStore(state => state.applyDetails);
	const removePlaylist = usePlaylistStore(state => state.removePlaylist);
	/** Playlist this hook was told was deleted. */
	const [deletedId, setDeletedId] = useState<string | null>(null);
	/** Playlist whose room this hook already joined once. */
	const joinedRef = useRef<string | null>(null);

	useEffect(() => {
		if (!socket || !isConnected) {
			return;
		}

		socket.emit('playlist:join', playlistId);
		if (__DEV__) console.log(`[Socket] Joined playlist room: ${playlistId}`);
		if (joinedRef.current === playlistId) {
			fetchPlaylistById(playlistId).catch(() => undefined);
		}
		joinedRef.current = playlistId;

		const handlePlaylistUpdate = (data: PlaylistUpdatedEvent) => {
			if (data.playlistId !== playlistId) return;

			if (__DEV__) console.log(`[Socket] Playlist updated: ${data.event}`, data);

			if (applyPlaylistEvent(data) === 'reload') {
				fetchPlaylistById(playlistId).catch(() => undefined);
			}
		};

		const handleDetails = (data: PlaylistDetailsEvent) => {
			if (data.playlistId !== playlistId) return;
			applyDetails(data);
		};

		const handleDeleted = (data: PlaylistDeletedEvent) => {
			if (data.playlistId !== playlistId) return;
			removePlaylist(playlistId);
			setDeletedId(playlistId);
		};

		socket.on('playlist:updated', handlePlaylistUpdate);
		socket.on('playlist:details', handleDetails);
		socket.on('playlist:deleted', handleDeleted);

		return () => {
			socket.off('playlist:updated', handlePlaylistUpdate);
			socket.off('playlist:details', handleDetails);
			socket.off('playlist:deleted', handleDeleted);
			if (socket.connected) {
				socket.emit('playlist:leave', playlistId);
			}
			if (__DEV__) console.log(`[Socket] Left playlist room: ${playlistId}`);
		};
	}, [
		socket,
		isConnected,
		playlistId,
		applyPlaylistEvent,
		fetchPlaylistById,
		applyDetails,
		removePlaylist,
	]);

	return { deleted: deletedId === playlistId };
}
