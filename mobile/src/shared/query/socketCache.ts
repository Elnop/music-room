import { useEffect } from 'react';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { useSocketStore } from '@/shared/stores/socketStore';

export interface SocketCacheRule<Payload, Data> {
	/** As emitted by backend/src/realtime/. */
	event: string;
	/** Built with queryKeys; null ignores the payload. */
	queryKey: (payload: Payload) => QueryKey | null;
	/** Without it, when it returns undefined (e.g. stale version) or with nothing cached, the query is refetched. */
	update?: (current: Data, payload: Payload) => Data | undefined;
}

type SocketCacheResult = 'updated' | 'invalidated' | 'ignored';

export function applySocketEvent<Payload, Data>(
	client: QueryClient,
	rule: SocketCacheRule<Payload, Data>,
	payload: Payload
): SocketCacheResult {
	const queryKey = rule.queryKey(payload);
	if (!queryKey) return 'ignored';

	const current = client.getQueryData<Data>(queryKey);
	const next = rule.update && current !== undefined ? rule.update(current, payload) : undefined;
	if (next !== undefined) {
		client.setQueryData<Data>(queryKey, next);
		return 'updated';
	}
	void client.invalidateQueries({ queryKey });
	return 'invalidated';
}

/** A rule with its payload type erased, so rules of any type share one list. */
interface SocketCacheBinding {
	event: string;
	apply: (client: QueryClient, payload: unknown) => SocketCacheResult;
}

/** Socket.io payloads are untyped at runtime: the payload type is the backend's contract for the event. */
export function socketCacheRule<Payload, Data>(
	rule: SocketCacheRule<Payload, Data>
): SocketCacheBinding {
	return {
		event: rule.event,
		apply: (client, payload) => applySocketEvent(client, rule, payload as Payload),
	};
}

export function bindSocketCache(
	socket: Socket,
	client: QueryClient,
	bindings: readonly SocketCacheBinding[]
): () => void {
	const listeners = bindings.map(binding => {
		const listener = (payload: unknown) => {
			binding.apply(client, payload);
		};
		socket.on(binding.event, listener);
		return { event: binding.event, listener };
	});
	return () => {
		for (const { event, listener } of listeners) socket.off(event, listener);
	};
}

/** Pass a stable `bindings` array (module constant or useMemo). */
export function useSocketCache(bindings: readonly SocketCacheBinding[]): void {
	const socket = useSocketStore(state => state.socket);
	const client = useQueryClient();

	useEffect(() => {
		if (!socket) return undefined;
		return bindSocketCache(socket, client, bindings);
	}, [socket, client, bindings]);
}
