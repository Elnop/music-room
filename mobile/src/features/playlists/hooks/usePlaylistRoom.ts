import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { useSocketCache } from '@/shared/query/socketCache';
import { useSocketStore } from '@/shared/stores/socketStore';
import type { PlaylistDeletedEvent } from '@/features/playlists/types';
import { PLAYLIST_SOCKET_RULES } from '@/features/playlists/utils/playlistSocketRules';

interface PlaylistRoom {
	/** The playlist was deleted by its owner while on screen (#342). */
	deleted: boolean;
}

/**
 * Real-time updates of an open playlist: joins its room while mounted, and lets
 * the playlist events patch the cache (utils/playlistSocketRules.ts).
 * Re-joining after a reconnect reloads the playlist, since events sent while
 * disconnected are lost; the first join relies on the screen's own load.
 */
export function usePlaylistRoom(playlistId: string): PlaylistRoom {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const client = useQueryClient();
	const [deletedId, setDeletedId] = useState<string | null>(null);
	/** Playlist whose room this hook already joined once. */
	const joinedRef = useRef<string | null>(null);

	useSocketCache(PLAYLIST_SOCKET_RULES);

	useEffect(() => {
		if (!socket || !isConnected) return undefined;

		socket.emit('playlist:join', playlistId);
		if (joinedRef.current === playlistId) {
			void client.invalidateQueries({
				queryKey: queryKeys.playlists.detail(playlistId),
				exact: true,
			});
		}
		joinedRef.current = playlistId;

		const handleDeleted = (data: PlaylistDeletedEvent) => {
			if (data.playlistId === playlistId) setDeletedId(playlistId);
		};
		socket.on('playlist:deleted', handleDeleted);

		return () => {
			socket.off('playlist:deleted', handleDeleted);
			if (socket.connected) socket.emit('playlist:leave', playlistId);
		};
	}, [socket, isConnected, playlistId, client]);

	return { deleted: deletedId === playlistId };
}
