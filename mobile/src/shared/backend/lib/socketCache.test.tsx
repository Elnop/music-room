import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { createQueryClient } from '@/shared/backend/queryClient';
import {
	applySocketEvent,
	bindSocketCache,
	socketCacheRule,
	useSocketCache,
} from '@/shared/backend/lib/socketCache';
import type { SocketCacheRule } from '@/shared/backend/lib/socketCache';
import { useSocketStore } from '@/shared/backend/socketStore';

function playlistKey(playlistId: string) {
	return ['playlists', 'detail', playlistId] as const;
}

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/backend/socketStore', () => ({ useSocketStore: jest.fn() }));

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

const renameRule: SocketCacheRule<RenamedEvent, Playlist> = {
	event: 'playlist:renamed',
	queryKey: payload => playlistKey(payload.playlistId),
	update: (current, payload) =>
		payload.version > current.version
			? { ...current, name: payload.name, version: payload.version }
			: undefined,
};

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
	function emit(event: string, payload: unknown) {
		return listeners.get(event)?.forEach(listener => listener(payload));
	}
	return { socket: socket as unknown as Socket, raw: socket, emit, listeners };
}

describe('socketCache', () => {
	const key = playlistKey('p1');
	const clients: QueryClient[] = [];
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
				queryKey: payload => playlistKey(payload.playlistId),
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
			function wrapper({ children }: { children: React.ReactNode }) {
				return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
			}

			const { unmount } = renderHook(() => useSocketCache(bindings), { wrapper });
			emit('playlist:renamed', { playlistId: 'p1', name: 'New', version: 2 });
			expect(client.getQueryData<Playlist>(key)?.name).toBe('New');

			unmount();
			expect(raw.off).toHaveBeenCalledWith('playlist:renamed', expect.any(Function));
		});

		it('does nothing without a socket', () => {
			const client = createClient();
			setSocket(null);
			function wrapper({ children }: { children: React.ReactNode }) {
				return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
			}

			expect(() => renderHook(() => useSocketCache(bindings), { wrapper })).not.toThrow();
		});
	});
});
