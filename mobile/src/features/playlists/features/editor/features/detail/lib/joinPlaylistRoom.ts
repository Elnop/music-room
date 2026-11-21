import type { RefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import type { PlaylistDeletedEvent } from '@/features/playlists/shared/playlist/playlistTypes';

type PlaylistRoomJoin = {
	playlistId: string;
	client: QueryClient;
	joinedRef: RefObject<string | null>;
	onDeleted: (playlistId: string) => void;
};

export function joinPlaylistRoom(socket: Socket, join: PlaylistRoomJoin): () => void {
	const { playlistId, client, joinedRef } = join;
	socket.emit('playlist:join', playlistId);
	if (joinedRef.current === playlistId) {
		void client.invalidateQueries({
			queryKey: queryKeys.playlists.detail(playlistId),
			exact: true,
		});
	}
	joinedRef.current = playlistId;

	function handleDeleted(data: PlaylistDeletedEvent) {
		if (data.playlistId === playlistId) join.onDeleted(playlistId);
	}
	socket.on('playlist:deleted', handleDeleted);

	return () => {
		socket.off('playlist:deleted', handleDeleted);
		if (socket.connected) socket.emit('playlist:leave', playlistId);
	};
}
