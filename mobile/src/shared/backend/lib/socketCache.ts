import type { QueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import type {
	SocketCacheBinding,
	SocketCacheResult,
	SocketCacheRule,
} from '@/shared/backend/types/socketCacheTypes';

export function applySocketEvent<Payload, Data>(
	client: QueryClient,
	rule: SocketCacheRule<Payload, Data>,
	payload: Payload,
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

export function socketCacheRule<Payload, Data>(
	rule: SocketCacheRule<Payload, Data>,
): SocketCacheBinding {
	return {
		event: rule.event,
		apply: (client, payload) => applySocketEvent(client, rule, payload as Payload),
	};
}

export function bindSocketCache(
	socket: Socket,
	client: QueryClient,
	bindings: readonly SocketCacheBinding[],
): () => void {
	const listeners = bindings.map((binding) => {
		function listener(payload: unknown) {
			binding.apply(client, payload);
		}
		socket.on(binding.event, listener);
		return { event: binding.event, listener };
	});
	return () => {
		for (const { event, listener } of listeners) socket.off(event, listener);
	};
}
