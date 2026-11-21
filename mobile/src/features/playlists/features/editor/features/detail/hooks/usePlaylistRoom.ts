import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { useSocketCache } from '@/shared/backend/hooks/useSocketCache';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import type { PlaylistDeletedEvent } from '@/features/playlists/shared/playlist/lib/types';
import { PLAYLIST_SOCKET_RULES } from '@/features/playlists/features/editor/features/detail/lib/playlistSocketRules';

type PlaylistRoom = {
	deleted: boolean;
};

export function usePlaylistRoom(playlistId: string): PlaylistRoom {
	const socket = useSocketState(state => state.socket);
	const isConnected = useSocketState(state => state.isConnected);
	const client = useQueryClient();
	const [deletedId, setDeletedId] = useState<string | null>(null);
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

		function handleDeleted(data: PlaylistDeletedEvent) {
			if (data.playlistId === playlistId) setDeletedId(playlistId);
		}
		socket.on('playlist:deleted', handleDeleted);

		return () => {
			socket.off('playlist:deleted', handleDeleted);
			if (socket.connected) socket.emit('playlist:leave', playlistId);
		};
	}, [socket, isConnected, playlistId, client]);

	return { deleted: deletedId === playlistId };
}
