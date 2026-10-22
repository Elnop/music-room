import { useEffect } from 'react';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { useSocketStore } from '@/shared/stores/socketStore';

/** What one Socket.io event does to the query cache. */
export interface SocketCacheRule<Payload, Data> {
	/** Socket.io event name, as emitted by backend/src/realtime/. */
	event: string;
	/** The query the payload belongs to, built with queryKeys; null ignores it. */
	queryKey: (payload: Payload) => QueryKey | null;
	/**
	 * Patches the cached data with the payload. Without it, or when it returns
	 * undefined (the payload cannot be applied, e.g. a stale version), or when
	 * nothing is cached yet, the query is invalidated and refetched instead.
	 */
	update?: (current: Data, payload: Payload) => Data | undefined;
}

type SocketCacheResult = 'updated' | 'invalidated' | 'ignored';

/** Applies one event payload to the cache, following its rule. */
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

/**
 * Types a rule against its payload and cached data. Socket.io payloads are
 * untyped at runtime: the payload type is the backend's contract for the event.
 */
export function socketCacheRule<Payload, Data>(
	rule: SocketCacheRule<Payload, Data>
): SocketCacheBinding {
	return {
		event: rule.event,
		apply: (client, payload) => applySocketEvent(client, rule, payload as Payload),
	};
}

/** Listens to every binding's event on the socket; returns the cleanup. */
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

/**
 * Keeps the query cache in sync with Socket.io events while mounted, on the
 * current socket. Pass a stable `bindings` array (module constant or useMemo).
 */
export function useSocketCache(bindings: readonly SocketCacheBinding[]): void {
	const socket = useSocketStore(state => state.socket);
	const client = useQueryClient();

	useEffect(() => {
		if (!socket) return undefined;
		return bindSocketCache(socket, client, bindings);
	}, [socket, client, bindings]);
}
