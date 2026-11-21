import type { QueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { createQueryClient } from '@/shared/backend/queryClient';
import {
	applySocketEvent,
	bindSocketCache,
	socketCacheRule,
} from '@/shared/backend/lib/socketCache';
import type { SocketCacheRule } from '@/shared/backend/types/socketCacheTypes';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

type Playlist = {
	id: string;
	name: string;
	version: number;
};
type RenamedEvent = {
	playlistId: string;
	name: string;
	version: number;
};

const playlistKeys = {
	detail: (playlistId: string) => ['playlists', 'detail', playlistId] as const,
	ofEvent: (payload: { playlistId: string }) => playlistKeys.detail(payload.playlistId),
	ofMineOnly: (payload: { playlistId: string }) =>
		payload.playlistId === 'mine' ? playlistKeys.detail('p1') : null,
};

const renameRule: SocketCacheRule<RenamedEvent, Playlist> = {
	event: 'playlist:renamed',
	queryKey: playlistKeys.ofEvent,
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
		for (const listener of listeners.get(event) ?? []) listener(payload);
	}
	return { socket: socket as unknown as Socket, raw: socket, emit };
}

describe('socketCache', () => {
	const clients: QueryClient[] = [];
	function createClient(): QueryClient {
		const client = createQueryClient();
		clients.push(client);
		return client;
	}
	afterEach(() => {
		for (const client of clients.splice(0)) client.clear();
	});

	describe('applySocketEvent', () => {
		it('patches the cached data with setQueryData', () => {
			const client = createClient();
			client.setQueryData<Playlist>(playlistKeys.detail('p1'), {
				id: 'p1',
				name: 'Old',
				version: 1,
			});

			const result = applySocketEvent(client, renameRule, {
				playlistId: 'p1',
				name: 'New',
				version: 2,
			});

			expect(result).toBe('updated');
			expect(client.getQueryData<Playlist>(playlistKeys.detail('p1'))?.name).toBe('New');
		});

		it('invalidates instead when the update refuses a stale payload', () => {
			const client = createClient();
			client.setQueryData<Playlist>(playlistKeys.detail('p1'), {
				id: 'p1',
				name: 'Current',
				version: 3,
			});
			const invalidate = jest.spyOn(client, 'invalidateQueries');

			const result = applySocketEvent(client, renameRule, {
				playlistId: 'p1',
				name: 'Stale',
				version: 2,
			});

			expect(result).toBe('invalidated');
			expect(client.getQueryData<Playlist>(playlistKeys.detail('p1'))?.name).toBe('Current');
			expect(invalidate).toHaveBeenCalledWith({ queryKey: playlistKeys.detail('p1') });
		});

		it('invalidates when nothing is cached yet', () => {
			const client = createClient();
			const invalidate = jest.spyOn(client, 'invalidateQueries');

			expect(
				applySocketEvent(client, renameRule, { playlistId: 'p1', name: 'X', version: 1 })
			).toBe('invalidated');
			expect(invalidate).toHaveBeenCalledWith({ queryKey: playlistKeys.detail('p1') });
		});

		it('invalidates a rule without update', () => {
			const client = createClient();
			const invalidate = jest.spyOn(client, 'invalidateQueries');
			const rule: SocketCacheRule<{ playlistId: string }, Playlist> = {
				event: 'playlist:deleted',
				queryKey: playlistKeys.ofEvent,
			};

			expect(applySocketEvent(client, rule, { playlistId: 'p1' })).toBe('invalidated');
			expect(invalidate).toHaveBeenCalledWith({ queryKey: playlistKeys.detail('p1') });
		});

		it('ignores a payload whose rule returns no key', () => {
			const client = createClient();
			const invalidate = jest.spyOn(client, 'invalidateQueries');
			const rule: SocketCacheRule<{ playlistId: string }, Playlist> = {
				event: 'playlist:updated',
				queryKey: playlistKeys.ofMineOnly,
			};

			expect(applySocketEvent(client, rule, { playlistId: 'other' })).toBe('ignored');
			expect(invalidate).not.toHaveBeenCalled();
		});
	});

	describe('bindSocketCache', () => {
		it('applies emitted events until the cleanup runs', () => {
			const client = createClient();
			client.setQueryData<Playlist>(playlistKeys.detail('p1'), {
				id: 'p1',
				name: 'Old',
				version: 1,
			});
			const { socket, raw, emit } = fakeSocket();

			const cleanup = bindSocketCache(socket, client, [socketCacheRule(renameRule)]);
			emit('playlist:renamed', { playlistId: 'p1', name: 'New', version: 2 });
			expect(client.getQueryData<Playlist>(playlistKeys.detail('p1'))?.name).toBe('New');

			cleanup();
			emit('playlist:renamed', { playlistId: 'p1', name: 'Later', version: 3 });
			expect(client.getQueryData<Playlist>(playlistKeys.detail('p1'))?.name).toBe('New');
			expect(raw.off).toHaveBeenCalledWith('playlist:renamed', expect.any(Function));
		});
	});
});
