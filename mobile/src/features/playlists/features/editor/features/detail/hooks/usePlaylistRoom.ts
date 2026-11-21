import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketCache } from '@/shared/backend/hooks/useSocketCache';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { PLAYLIST_SOCKET_RULES } from '@/features/playlists/features/editor/features/detail/playlistSocketConfig';
import { joinPlaylistRoom } from '@/features/playlists/features/editor/features/detail/lib/joinPlaylistRoom';

type PlaylistRoom = {
	deleted: boolean;
};

export function usePlaylistRoom(playlistId: string): PlaylistRoom {
	const socket = useSocketState(state => (state.isConnected ? state.socket : null));
	const client = useQueryClient();
	const [deletedId, setDeletedId] = useState<string | null>(null);
	const joinedRef = useRef<string | null>(null);

	useSocketCache(PLAYLIST_SOCKET_RULES);

	useEffect(() => {
		if (!socket) return undefined;
		return joinPlaylistRoom(socket, { playlistId, client, joinedRef, onDeleted: setDeletedId });
	}, [socket, playlistId, client]);

	return { deleted: deletedId === playlistId };
}
