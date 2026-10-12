import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaylistRow } from '@/features/playlists/playlist.types.js';
import type { AppSocketServer } from '@/realtime/socket-auth.js';

const { maybeSingle, from } = vi.hoisted(() => ({ maybeSingle: vi.fn(), from: vi.fn() }));

vi.mock('@/shared/config/supabase.js', () => {
	const query = { select: () => query, eq: () => query, maybeSingle };
	from.mockImplementation(() => query);
	return { supabaseAdmin: { from } };
});

const { authorizePlaylistJoin, revalidatePlaylistRoom } =
	await import('@/realtime/playlist-room.js');

const PLAYLIST_ID = randomUUID();
const OWNER = 'owner-id';
const COLLABORATOR = 'collaborator-id';
const VIEWER = 'viewer-id';
const STRANGER = 'stranger-id';

function playlist(visibility: 'public' | 'private'): PlaylistRow {
	return {
		id: PLAYLIST_ID,
		name: 'Playlist',
		description: null,
		cover_url: null,
		owner_id: OWNER,
		visibility,
		edit_mode: 'restricted',
		collaborator_ids: [COLLABORATOR],
		viewer_ids: [VIEWER],
		created_at: null,
		updated_at: null,
		tracks_version: 0,
		ranks_rebalanced_at_version: 0,
	};
}

beforeEach(() => {
	maybeSingle.mockReset();
	from.mockClear();
});

describe('authorizePlaylistJoin', () => {
	it('allows anyone on a public playlist', async () => {
		maybeSingle.mockResolvedValue({ data: playlist('public'), error: null });
		await expect(authorizePlaylistJoin(PLAYLIST_ID, STRANGER)).resolves.toEqual({
			ok: true,
			playlistId: PLAYLIST_ID,
		});
	});

	it.each([OWNER, VIEWER, COLLABORATOR])('allows %s on a private playlist', async user => {
		maybeSingle.mockResolvedValue({ data: playlist('private'), error: null });
		await expect(authorizePlaylistJoin(PLAYLIST_ID, user)).resolves.toEqual({
			ok: true,
			playlistId: PLAYLIST_ID,
		});
	});

	it('denies a non-invited user on a private playlist', async () => {
		maybeSingle.mockResolvedValue({ data: playlist('private'), error: null });
		await expect(authorizePlaylistJoin(PLAYLIST_ID, STRANGER)).resolves.toMatchObject({
			ok: false,
			playlistId: PLAYLIST_ID,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
	});

	it('returns PLAYLIST_NOT_FOUND for an unknown playlist', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: null });
		await expect(authorizePlaylistJoin(PLAYLIST_ID, OWNER)).resolves.toMatchObject({
			ok: false,
			playlistId: PLAYLIST_ID,
			code: 'PLAYLIST_NOT_FOUND',
		});
	});

	it('returns PLAYLIST_NOT_FOUND when the lookup fails', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: { message: 'fetch failed' } });
		await expect(authorizePlaylistJoin(PLAYLIST_ID, OWNER)).resolves.toMatchObject({
			ok: false,
			code: 'PLAYLIST_NOT_FOUND',
		});
	});

	it.each([
		[42, null],
		[{ playlistId: 'x' }, null],
		[undefined, null],
		['', ''],
		['not-a-uuid', 'not-a-uuid'],
	])('rejects payload %j with INVALID_PAYLOAD and no DB call', async (payload, expectedId) => {
		await expect(authorizePlaylistJoin(payload, OWNER)).resolves.toMatchObject({
			ok: false,
			playlistId: expectedId,
			code: 'INVALID_PAYLOAD',
		});
		expect(from).not.toHaveBeenCalled();
	});
});

describe('revalidatePlaylistRoom', () => {
	function fakeSocket(userId: string) {
		return { id: `socket-${userId}`, data: { userId }, leave: vi.fn(), emit: vi.fn() };
	}

	function fakeIo(sockets: ReturnType<typeof fakeSocket>[]) {
		const inRoom = vi.fn(() => ({ fetchSockets: () => Promise.resolve(sockets) }));
		return { io: { in: inRoom } as unknown as AppSocketServer, inRoom };
	}

	it('evicts only the sockets that lost access', async () => {
		maybeSingle.mockResolvedValue({ data: playlist('private'), error: null });
		const owner = fakeSocket(OWNER);
		const stranger = fakeSocket(STRANGER);
		const { io, inRoom } = fakeIo([owner, stranger]);

		await revalidatePlaylistRoom(io, PLAYLIST_ID);

		expect(inRoom).toHaveBeenCalledWith(`playlist:${PLAYLIST_ID}`);
		expect(owner.leave).not.toHaveBeenCalled();
		expect(owner.emit).not.toHaveBeenCalled();
		expect(stranger.leave).toHaveBeenCalledWith(`playlist:${PLAYLIST_ID}`);
		expect(stranger.emit).toHaveBeenCalledWith(
			'playlist:error',
			expect.objectContaining({ playlistId: PLAYLIST_ID, code: 'PLAYLIST_ACCESS_DENIED' })
		);
	});

	it('evicts everyone with PLAYLIST_NOT_FOUND when the playlist is gone', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: null });
		const owner = fakeSocket(OWNER);
		const viewer = fakeSocket(VIEWER);
		const { io } = fakeIo([owner, viewer]);

		await revalidatePlaylistRoom(io, PLAYLIST_ID);

		for (const socket of [owner, viewer]) {
			expect(socket.leave).toHaveBeenCalled();
			expect(socket.emit).toHaveBeenCalledWith(
				'playlist:error',
				expect.objectContaining({ code: 'PLAYLIST_NOT_FOUND' })
			);
		}
	});

	it('evicts nobody when the lookup fails', async () => {
		maybeSingle.mockResolvedValue({ data: null, error: { message: 'fetch failed' } });
		const owner = fakeSocket(OWNER);
		const stranger = fakeSocket(STRANGER);
		const { io } = fakeIo([owner, stranger]);

		await revalidatePlaylistRoom(io, PLAYLIST_ID);

		for (const socket of [owner, stranger]) {
			expect(socket.leave).not.toHaveBeenCalled();
			expect(socket.emit).not.toHaveBeenCalled();
		}
	});

	it('skips the lookup for an empty room', async () => {
		const { io } = fakeIo([]);
		await revalidatePlaylistRoom(io, PLAYLIST_ID);
		expect(from).not.toHaveBeenCalled();
	});

	it('never throws', async () => {
		const io = {
			in: () => ({ fetchSockets: () => Promise.reject(new Error('adapter down')) }),
		} as unknown as AppSocketServer;
		await expect(revalidatePlaylistRoom(io, PLAYLIST_ID)).resolves.toBeUndefined();
	});
});
