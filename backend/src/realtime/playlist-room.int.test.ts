import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import * as viewerService from '@/features/playlists/services/viewer.service.js';
import * as collaboratorService from '@/features/playlists/services/collaborator.service.js';
import * as playlistUpdateService from '@/features/playlists/services/playlist-update.service.js';
import * as socketServer from '@/realtime/socket-server.js';
import { getIO } from '@/realtime/state.js';
import * as realtime from '@/realtime/emitters/playlist.emitters.js';
import type { PlaylistRoomError } from '@/realtime/playlist-room.js';
import type { PlaylistUpdatedPayload } from '@/features/playlists/playlist.types.js';

interface TestUser {
	id: string;
	token: string;
}

interface PlaylistUpdated {
	playlistId: string;
	event: string;
}

const PASSWORD = 'integration-test-password';

/** Any versioned delta: these tests only check who receives it. */
function moved(playlistId: string): PlaylistUpdatedPayload {
	return {
		playlistId,
		tracksVersion: 1,
		rebalanced: false,
		event: 'track_moved',
		trackId: randomUUID(),
		rank: 'V',
	};
}

async function createUser(): Promise<TestUser> {
	const email = `int-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;

	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `int_${id.slice(0, 8)}` });
	if (profileError) throw profileError;

	// Sign in with the anon client, never the admin one.
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	return { id, token: session.session.access_token };
}

describe('Playlist room access control', () => {
	let httpServer: HTTPServer;
	let url: string;
	let owner: TestUser;
	let viewer: TestUser;
	let outsider: TestUser;
	const clients: ClientSocket[] = [];
	const playlistIds: string[] = [];

	async function createPlaylist(
		visibility: 'public' | 'private',
		collaboratorIds: string[] = []
	): Promise<string> {
		const { data, error } = await supabaseAdmin
			.from('playlists')
			.insert({
				name: `int-${randomUUID().slice(0, 8)}`,
				owner_id: owner.id,
				visibility,
				viewer_ids: [viewer.id],
				collaborator_ids: collaboratorIds,
			})
			.select('id')
			.single();
		if (error) throw error;
		playlistIds.push(data.id);
		return data.id;
	}

	async function connect(user: TestUser): Promise<ClientSocket> {
		const socket = ioClient(url, {
			auth: {
				token: user.token,
				deviceId: `dev-${randomUUID()}`,
				deviceName: 'Test device',
				platform: 'android',
				model: 'Pixel Test',
				appVersion: '1.0.0',
			},
			transports: ['websocket'],
			reconnection: false,
			forceNew: true,
		});
		clients.push(socket);
		await new Promise<void>((resolve, reject) => {
			socket.once('connect', () => resolve());
			socket.once('connect_error', err => reject(err));
		});
		return socket;
	}

	function nextEvent<T>(socket: ClientSocket, event: string): Promise<T> {
		return new Promise(resolve => socket.once(event, (payload: T) => resolve(payload)));
	}

	async function inRoom(socket: ClientSocket, playlistId: string): Promise<boolean> {
		const sockets = await getIO()!.fetchSockets();
		const found = sockets.find(s => s.id === socket.id);
		return found?.rooms.has(`playlist:${playlistId}`) ?? false;
	}

	async function join(socket: ClientSocket, playlistId: string): Promise<void> {
		socket.emit('playlist:join', playlistId);
		await vi.waitFor(async () => expect(await inRoom(socket, playlistId)).toBe(true));
	}

	function record(socket: ClientSocket): PlaylistUpdated[] {
		const received: PlaylistUpdated[] = [];
		socket.on('playlist:updated', (payload: PlaylistUpdated) => received.push(payload));
		return received;
	}

	/** Leave time for a stray broadcast to arrive after the expected ones. */
	const settle = () => new Promise(resolve => setTimeout(resolve, 150));

	beforeAll(async () => {
		// verifyToken checks the logout denylist and fails closed without Redis.
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		owner = await createUser();
		viewer = await createUser();
		outsider = await createUser();

		httpServer = createServer();
		socketServer.initialize(httpServer);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		const { port } = httpServer.address() as AddressInfo;
		url = `http://127.0.0.1:${port}`;
	});

	afterEach(() => {
		while (clients.length) clients.pop()?.disconnect();
	});

	afterAll(async () => {
		await getIO()?.close();
		if (playlistIds.length) await supabaseAdmin.from('playlists').delete().in('id', playlistIds);
		for (const user of [owner, viewer, outsider]) {
			if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
		}
		await disconnectRedis();
	});

	it('lets owner and viewer into a private playlist room and refuses the outsider', async () => {
		const playlistId = await createPlaylist('private');
		const [ownerSocket, viewerSocket, outsiderSocket] = await Promise.all([
			connect(owner),
			connect(viewer),
			connect(outsider),
		]);

		const refusal = nextEvent<PlaylistRoomError>(outsiderSocket, 'playlist:error');
		outsiderSocket.emit('playlist:join', playlistId);
		await join(ownerSocket, playlistId);
		await join(viewerSocket, playlistId);
		await expect(refusal).resolves.toMatchObject({
			playlistId,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
		expect(await inRoom(outsiderSocket, playlistId)).toBe(false);

		const outsiderUpdates = record(outsiderSocket);
		const ownerUpdate = nextEvent<PlaylistUpdated>(ownerSocket, 'playlist:updated');
		const viewerUpdate = nextEvent<PlaylistUpdated>(viewerSocket, 'playlist:updated');
		realtime.notifyPlaylistUpdate(moved(playlistId));

		await expect(ownerUpdate).resolves.toMatchObject({ playlistId, event: 'track_moved' });
		await expect(viewerUpdate).resolves.toMatchObject({ playlistId, event: 'track_moved' });
		await settle();
		expect(outsiderUpdates).toEqual([]);
	});

	it('lets anyone into a public playlist room', async () => {
		const playlistId = await createPlaylist('public');
		const outsiderSocket = await connect(outsider);
		await join(outsiderSocket, playlistId);

		const update = nextEvent<PlaylistUpdated>(outsiderSocket, 'playlist:updated');
		realtime.notifyPlaylistUpdate(moved(playlistId));
		await expect(update).resolves.toMatchObject({ playlistId, event: 'track_moved' });
	});

	it('refuses an unknown playlist with PLAYLIST_NOT_FOUND', async () => {
		const socket = await connect(owner);
		const unknownId = randomUUID();
		const refusal = nextEvent<PlaylistRoomError>(socket, 'playlist:error');
		socket.emit('playlist:join', unknownId);
		await expect(refusal).resolves.toMatchObject({
			playlistId: unknownId,
			code: 'PLAYLIST_NOT_FOUND',
		});
		expect(await inRoom(socket, unknownId)).toBe(false);
	});

	it('refuses a malformed payload with INVALID_PAYLOAD', async () => {
		const socket = await connect(owner);
		const refusal = nextEvent<PlaylistRoomError>(socket, 'playlist:error');
		socket.emit('playlist:join', { id: 42 });
		await expect(refusal).resolves.toMatchObject({ playlistId: null, code: 'INVALID_PAYLOAD' });
	});

	it('evicts a viewer removed while in the room', async () => {
		const playlistId = await createPlaylist('private');
		const [ownerSocket, viewerSocket] = await Promise.all([connect(owner), connect(viewer)]);
		await join(ownerSocket, playlistId);
		await join(viewerSocket, playlistId);

		const eviction = nextEvent<PlaylistRoomError>(viewerSocket, 'playlist:error');
		await viewerService.removeViewer(playlistId, owner.id, viewer.id);
		await expect(eviction).resolves.toMatchObject({
			playlistId,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
		expect(await inRoom(viewerSocket, playlistId)).toBe(false);

		const viewerUpdates = record(viewerSocket);
		const ownerUpdate = nextEvent<PlaylistUpdated>(ownerSocket, 'playlist:updated');
		realtime.notifyPlaylistUpdate(moved(playlistId));
		await expect(ownerUpdate).resolves.toMatchObject({ playlistId });
		await settle();
		expect(viewerUpdates).toEqual([]);
	});

	it('evicts a collaborator removed while in the room', async () => {
		const playlistId = await createPlaylist('private', [outsider.id]);
		const [ownerSocket, collaboratorSocket] = await Promise.all([
			connect(owner),
			connect(outsider),
		]);
		await join(ownerSocket, playlistId);
		await join(collaboratorSocket, playlistId);

		const eviction = nextEvent<PlaylistRoomError>(collaboratorSocket, 'playlist:error');
		await collaboratorService.removeCollaborator(playlistId, owner.id, outsider.id);
		await expect(eviction).resolves.toMatchObject({
			playlistId,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
		expect(await inRoom(collaboratorSocket, playlistId)).toBe(false);

		const collaboratorUpdates = record(collaboratorSocket);
		const ownerUpdate = nextEvent<PlaylistUpdated>(ownerSocket, 'playlist:updated');
		realtime.notifyPlaylistUpdate(moved(playlistId));
		await expect(ownerUpdate).resolves.toMatchObject({ playlistId });
		await settle();
		expect(collaboratorUpdates).toEqual([]);
	});

	it('handles join then leave in order: the socket ends outside the room', async () => {
		const playlistId = await createPlaylist('private');
		const [ownerSocket, viewerSocket] = await Promise.all([connect(owner), connect(viewer)]);
		await join(viewerSocket, playlistId);

		ownerSocket.emit('playlist:join', playlistId);
		ownerSocket.emit('playlist:leave', playlistId);
		// Queued after the leave: once it answers, join and leave were processed.
		const done = nextEvent<PlaylistRoomError>(ownerSocket, 'playlist:error');
		ownerSocket.emit('playlist:join', 'not-a-uuid');
		await expect(done).resolves.toMatchObject({ code: 'INVALID_PAYLOAD' });
		expect(await inRoom(ownerSocket, playlistId)).toBe(false);

		const ownerUpdates = record(ownerSocket);
		const viewerUpdate = nextEvent<PlaylistUpdated>(viewerSocket, 'playlist:updated');
		realtime.notifyPlaylistUpdate(moved(playlistId));
		await expect(viewerUpdate).resolves.toMatchObject({ playlistId });
		await settle();
		expect(ownerUpdates).toEqual([]);
	});

	it('evicts the outsider when a public playlist becomes private', async () => {
		const playlistId = await createPlaylist('public');
		const [ownerSocket, viewerSocket, outsiderSocket] = await Promise.all([
			connect(owner),
			connect(viewer),
			connect(outsider),
		]);
		await join(ownerSocket, playlistId);
		await join(viewerSocket, playlistId);
		await join(outsiderSocket, playlistId);

		const eviction = nextEvent<PlaylistRoomError>(outsiderSocket, 'playlist:error');
		await playlistUpdateService.updatePlaylist(playlistId, owner.id, { visibility: 'private' });
		await expect(eviction).resolves.toMatchObject({
			playlistId,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
		expect(await inRoom(outsiderSocket, playlistId)).toBe(false);
		expect(await inRoom(ownerSocket, playlistId)).toBe(true);
		expect(await inRoom(viewerSocket, playlistId)).toBe(true);
	});

	it('evicts everyone when the playlist is deleted', async () => {
		const playlistId = await createPlaylist('private');
		const [ownerSocket, viewerSocket] = await Promise.all([connect(owner), connect(viewer)]);
		await join(ownerSocket, playlistId);
		await join(viewerSocket, playlistId);

		const evictions = [ownerSocket, viewerSocket].map(s =>
			nextEvent<PlaylistRoomError>(s, 'playlist:error')
		);
		await playlistUpdateService.deletePlaylist(playlistId, owner.id);
		for (const eviction of evictions) {
			await expect(eviction).resolves.toMatchObject({ playlistId, code: 'PLAYLIST_NOT_FOUND' });
		}
		expect(await inRoom(ownerSocket, playlistId)).toBe(false);
		expect(await inRoom(viewerSocket, playlistId)).toBe(false);
	});
});
