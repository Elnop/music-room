import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { bindSocketCache } from '@/shared/backend/lib/socketCache';
import type { SocketCacheBinding } from '@/shared/backend/types/socketCacheTypes';

export function useSocketCache(bindings: readonly SocketCacheBinding[]): void {
	const socket = useSocketState(state => state.socket);
	const client = useQueryClient();

	useEffect(() => {
		if (!socket) return undefined;
		return bindSocketCache(socket, client, bindings);
	}, [socket, client, bindings]);
}
