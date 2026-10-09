import { useEffect } from 'react';
import { useSocketStore } from '@store/socketStore';
import { usePlaylistStore } from '@store/playlistStore';
import type { PlaylistUpdatedEvent } from '@/types/playlist.types';

/**
 * Hook for real-time playlist updates
 *
 * Joins the playlist room on mount, leaves on unmount.
 * Updates the playlist locally when tracks are added/removed.
 *
 * @param playlistId - The playlist ID to watch
 * @param onReorder - Optional callback for move events (full refresh until
 *   version-aware convergence, #91)
 */
export function usePlaylistSocket(playlistId: string, onReorder?: () => void) {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const addTrackLocally = usePlaylistStore(state => state.addTrackLocally);
	const removeTrackLocally = usePlaylistStore(state => state.removeTrackLocally);

	useEffect(() => {
		if (!socket || !isConnected) {
			return;
		}

		socket.emit('playlist:join', playlistId);
		if (__DEV__) console.log(`[Socket] Joined playlist room: ${playlistId}`);

		const handlePlaylistUpdate = (data: PlaylistUpdatedEvent) => {
			if (data.playlistId !== playlistId) return;

			if (__DEV__) console.log(`[Socket] Playlist updated: ${data.event}`, data);

			switch (data.event) {
				case 'track_added':
					addTrackLocally(playlistId, data.track);
					break;
				case 'track_removed':
					removeTrackLocally(playlistId, data.trackId);
					break;
				case 'track_moved':
					onReorder?.();
					break;
			}
		};

		socket.on('playlist:updated', handlePlaylistUpdate);

		return () => {
			if (socket) {
				socket.off('playlist:updated', handlePlaylistUpdate);
				if (socket.connected) {
					socket.emit('playlist:leave', playlistId);
				}
				if (__DEV__) console.log(`[Socket] Left playlist room: ${playlistId}`);
			}
		};
	}, [socket, isConnected, playlistId, addTrackLocally, removeTrackLocally, onReorder]);
}
