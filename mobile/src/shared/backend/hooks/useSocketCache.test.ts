import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { QUERY_DEFAULTS } from '@/shared/backend/configs/queryDefaultsConfig';
import { useSocketCache } from '@/shared/backend/hooks/useSocketCache';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { socketCacheRule } from '@/shared/backend/lib/socketCache';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));
jest.mock('@/shared/backend/hooks/useSocketState', () => ({ useSocketState: jest.fn() }));

const queueKeys = {
	detail: (ownerId: string) => ['queue', ownerId] as const,
	ofEvent: (payload: { ownerId: string }) => queueKeys.detail(payload.ownerId),
};

const bindings = [
	socketCacheRule<{ ownerId: string }, number>({
		event: 'queue:changed',
		queryKey: queueKeys.ofEvent,
		update: (current) => current + 1,
	}),
];

function setSocket(socket: Socket | null) {
	jest
		.mocked(useSocketState)
		.mockImplementation(((selector: (state: { socket: Socket | null }) => unknown) =>
			selector({ socket })) as unknown as typeof useSocketState);
}

function renderSocketCache(client: QueryClient) {
	function wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(QueryClientProvider, { client }, children);
	}
	return renderHook(() => useSocketCache(bindings), { wrapper });
}

function fakeSocket() {
	const listeners = new Map<string, (payload: unknown) => void>();
	const raw = {
		on: jest.fn((event: string, listener: (payload: unknown) => void) => {
			listeners.set(event, listener);
		}),
		off: jest.fn(),
	};
	return { socket: raw as unknown as Socket, raw, listeners };
}

describe('useSocketCache', () => {
	let client: QueryClient;

	beforeEach(() => {
		client = new QueryClient({ defaultOptions: QUERY_DEFAULTS });
	});

	afterEach(() => {
		client.clear();
	});

	it('binds the current socket while mounted and unbinds on unmount', () => {
		client.setQueryData<number>(queueKeys.detail('u1'), 1);
		const { socket, raw, listeners } = fakeSocket();
		setSocket(socket);

		const { unmount } = renderSocketCache(client);
		listeners.get('queue:changed')?.({ ownerId: 'u1' });
		expect(client.getQueryData<number>(queueKeys.detail('u1'))).toBe(2);

		unmount();
		expect(raw.off).toHaveBeenCalledWith('queue:changed', expect.any(Function));
	});

	it('does nothing without a socket', () => {
		setSocket(null);

		expect(() => renderSocketCache(client)).not.toThrow();
	});
});
