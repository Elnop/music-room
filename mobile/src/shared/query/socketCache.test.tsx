import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { createQueryClient } from './queryClient';
import { queryKeys } from './keys';
import {
	applySocketEvent,
	bindSocketCache,
	socketCacheRule,
	useSocketCache,
	type SocketCacheRule,
} from './socketCache';
import { useSocketStore } from '@/shared/stores/socketStore';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/stores/socketStore', () => ({ useSocketStore: jest.fn() }));

interface Playlist {
	id: string;
	name: string;
	version: number;
}
interface RenamedEvent {
	playlistId: string;
	name: string;
	version: number;
}

/** Applies a rename unless the payload is older than the cache (stale). */
const renameRule: SocketCacheRule<RenamedEvent, Playlist> = {
	event: 'playlist:renamed',
	queryKey: payload => queryKeys.playlists.detail(payload.playlistId),
	update: (current, payload) =>
		payload.version > current.version
			? { ...current, name: payload.name, version: payload.version }
			: undefined,
};

/** A minimal socket: records listeners and lets the test emit. */
function fakeSocket() {
	const listeners = new Map<string, Set<(payload: unknown) => void>>();
	const socket = {
		on: jest.fn((event: string, listener: (payload: unknown) => void) => {
			if (!listeners.has(event)) listeners.set(event, new Set());
			listeners.get(event)?.add(listener);
		}),
		off: jest.fn((event: string, listener: (payload: unknown) => void) => {
			listeners.get(event)?.delete(listener);
		}),
	};
	const emit = (event: string, payload: unknown) =>
		listeners.get(event)?.forEach(listener => listener(payload));
	return { socket: socket as unknown as Socket, raw: socket, emit, listeners };
}

describe('socketCache', () => {
	const key = queryKeys.playlists.detail('p1');
	const clients: QueryClient[] = [];
	/** A fresh client, cleared after the test so its cache timers stop. */
	function createClient(): QueryClient {
		const client = createQueryClient();
		clients.push(client);
		return client;
	}
	afterEach(() => clients.splice(0).forEach(client => client.clear()));

	describe('applySocketEvent', () => {
		it('patches the cached data with setQueryData', () => {
			const client = createClient();
			client.setQueryData<Playlist>(key, { id: 'p1', name: 'Old', version: 1 });

			const result = applySocketEvent(client, renameRule, {
				playlistId: 'p1',
				name: 'New',
				version: 2,
			});

			expect(result).toBe('updated');
			expect(client.getQueryData<Playlist>(key)?.name).toBe('New');
		});

		it('invalidates instead when the update refuses a stale payload', () => {
			const client = createClient();
			client.setQueryData<Playlist>(key, { id: 'p1', name: 'Current', version: 3 });
			const invalidate = jest.spyOn(client, 'invalidateQueries');

			const result = applySocketEvent(client, renameRule, {
				playlistId: 'p1',
				name: 'Stale',
				version: 2,
			});

			expect(result).toBe('invalidated');
			expect(client.getQueryData<Playlist>(key)?.name).toBe('Current');
			expect(invalidate).toHaveBeenCalledWith({ queryKey: key });
		});

		it('invalidates when nothing is cached yet', () => {
			const client = createClient();
			const invalidate = jest.spyOn(client, 'invalidateQueries');

			expect(
				applySocketEvent(client, renameRule, { playlistId: 'p1', name: 'X', version: 1 })
			).toBe('invalidated');
			expect(invalidate).toHaveBeenCalledWith({ queryKey: key });
		});

		it('invalidates a rule without update', () => {
			const client = createClient();
			const invalidate = jest.spyOn(client, 'invalidateQueries');
			const rule: SocketCacheRule<{ playlistId: string }, Playlist> = {
				event: 'playlist:deleted',
				queryKey: payload => queryKeys.playlists.detail(payload.playlistId),
			};

			expect(applySocketEvent(client, rule, { playlistId: 'p1' })).toBe('invalidated');
			expect(invalidate).toHaveBeenCalledWith({ queryKey: key });
		});

		it('ignores a payload whose rule returns no key', () => {
			const client = createClient();
			const invalidate = jest.spyOn(client, 'invalidateQueries');
			const rule: SocketCacheRule<{ playlistId: string }, Playlist> = {
				event: 'playlist:updated',
				queryKey: payload => (payload.playlistId === 'mine' ? key : null),
			};

			expect(applySocketEvent(client, rule, { playlistId: 'other' })).toBe('ignored');
			expect(invalidate).not.toHaveBeenCalled();
		});
	});

	describe('bindSocketCache', () => {
		it('applies emitted events until the cleanup runs', () => {
			const client = createClient();
			client.setQueryData<Playlist>(key, { id: 'p1', name: 'Old', version: 1 });
			const { socket, raw, emit } = fakeSocket();

			const cleanup = bindSocketCache(socket, client, [socketCacheRule(renameRule)]);
			emit('playlist:renamed', { playlistId: 'p1', name: 'New', version: 2 });
			expect(client.getQueryData<Playlist>(key)?.name).toBe('New');

			cleanup();
			emit('playlist:renamed', { playlistId: 'p1', name: 'Later', version: 3 });
			expect(client.getQueryData<Playlist>(key)?.name).toBe('New');
			expect(raw.off).toHaveBeenCalledWith('playlist:renamed', expect.any(Function));
		});
	});

	describe('useSocketCache', () => {
		const bindings = [socketCacheRule(renameRule)];

		function setSocket(socket: Socket | null) {
			jest
				.mocked(useSocketStore)
				.mockImplementation(((selector: (state: { socket: Socket | null }) => unknown) =>
					selector({ socket })) as unknown as typeof useSocketStore);
		}

		it('binds the current socket while mounted and unbinds on unmount', () => {
			const client = createClient();
			client.setQueryData<Playlist>(key, { id: 'p1', name: 'Old', version: 1 });
			const { socket, raw, emit } = fakeSocket();
			setSocket(socket);
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<QueryClientProvider client={client}>{children}</QueryClientProvider>
			);

			const { unmount } = renderHook(() => useSocketCache(bindings), { wrapper });
			emit('playlist:renamed', { playlistId: 'p1', name: 'New', version: 2 });
			expect(client.getQueryData<Playlist>(key)?.name).toBe('New');

			unmount();
			expect(raw.off).toHaveBeenCalledWith('playlist:renamed', expect.any(Function));
		});

		it('does nothing without a socket', () => {
			const client = createClient();
			setSocket(null);
			const wrapper = ({ children }: { children: React.ReactNode }) => (
				<QueryClientProvider client={client}>{children}</QueryClientProvider>
			);

			expect(() => renderHook(() => useSocketCache(bindings), { wrapper })).not.toThrow();
		});
	});
});
