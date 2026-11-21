import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type SocketCacheRule<Payload, Data> = {
	event: string;
	queryKey: (payload: Payload) => QueryKey | null;
	update?: (current: Data, payload: Payload) => Data | undefined;
};

export type SocketCacheResult = 'updated' | 'invalidated' | 'ignored';

export type SocketCacheBinding = {
	event: string;
	apply: (client: QueryClient, payload: unknown) => SocketCacheResult;
};
