import { useEffect, useRef } from 'react';
import { useSocketStore } from '@store/socketStore';
import { usePlaylistStore } from '@store/playlistStore';
import type { PlaylistUpdatedEvent } from '@/types/playlist.types';

/**
 * Hook for real-time playlist updates
 *
 * Joins the playlist room on mount, leaves on unmount. Each `playlist:updated`
 * delta goes through the store, which applies it in version order; a skipped
 * version or a rebalance reloads the playlist (doc/PLAYLIST_CONCURRENCY.md).
 * Re-joining after a reconnect reloads too, since events sent while
 * disconnected are lost; the first join relies on the screen's own load.
 *
 * @param playlistId - The playlist ID to watch
 */
export function usePlaylistSocket(playlistId: string) {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const applyPlaylistEvent = usePlaylistStore(state => state.applyPlaylistEvent);
	const fetchPlaylistById = usePlaylistStore(state => state.fetchPlaylistById);
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

		socket.on('playlist:updated', handlePlaylistUpdate);

		return () => {
			socket.off('playlist:updated', handlePlaylistUpdate);
			if (socket.connected) {
				socket.emit('playlist:leave', playlistId);
			}
			if (__DEV__) console.log(`[Socket] Left playlist room: ${playlistId}`);
		};
	}, [socket, isConnected, playlistId, applyPlaylistEvent, fetchPlaylistById]);
}
