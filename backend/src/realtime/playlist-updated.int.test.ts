import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import * as tracks from '@/features/playlists/services/playlist-track.service.js';
import * as playlistService from '@/features/playlists/services/playlist.service.js';
import * as playlistUpdateService from '@/features/playlists/services/playlist-update.service.js';
import * as socketServer from '@/realtime/socket-server.js';
import { getIO } from '@/realtime/state.js';
import type {
	PlaylistDeletedPayload,
	PlaylistDetailsPayload,
	PlaylistUpdatedPayload,
} from '@/features/playlists/playlist.types.js';

// The versioned playlist:updated delta (#90, doc/features/playlist-concurrency.md,
// "Broadcast and convergence") emitted by real track operations to clients of
// a real Socket.io server, against the local Supabase stack.

interface TestUser {
	id: string;
	token: string;
}

const PASSWORD = 'integration-test-password';
const URI_PREFIX = `https://soundcloud.com/int-broadcast/${randomUUID()}`;

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

	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	return { id, token: session.session.access_token };
}

describe('playlist:updated broadcast', () => {
	let httpServer: HTTPServer;
	let url: string;
	let owner: TestUser;
	let viewer: TestUser;
	let outsider: TestUser;
	let playlistId: string;
	let ownerSocket: ClientSocket;
	let viewerSocket: ClientSocket;
	let outsiderSocket: ClientSocket;
	const clients: ClientSocket[] = [];
	let trackCount = 0;

	const dto = () => {
		trackCount += 1;
		return {
			trackUri: `${URI_PREFIX}/${trackCount}`,
			title: `T${trackCount}`,
			artist: 'A',
			durationMs: 1000,
		};
	};

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

	async function inRoom(socket: ClientSocket): Promise<boolean> {
		const sockets = await getIO()!.fetchSockets();
		return sockets.find(s => s.id === socket.id)?.rooms.has(`playlist:${playlistId}`) ?? false;
	}

	async function join(socket: ClientSocket): Promise<void> {
		socket.emit('playlist:join', playlistId);
		await vi.waitFor(async () => expect(await inRoom(socket)).toBe(true));
	}

	/** Collect every playlist:updated a socket receives. */
	function record(socket: ClientSocket): PlaylistUpdatedPayload[] {
		const received: PlaylistUpdatedPayload[] = [];
		socket.on('playlist:updated', (payload: PlaylistUpdatedPayload) => received.push(payload));
		return received;
	}

	/** The next playlist:updated received by both room members. */
	function bothReceive(): Promise<PlaylistUpdatedPayload[]> {
		return Promise.all(
			[ownerSocket, viewerSocket].map(
				s => new Promise<PlaylistUpdatedPayload>(resolve => s.once('playlist:updated', resolve))
			)
		);
	}

	/** Leave time for a stray broadcast to arrive after the expected ones. */
	const settle = () => new Promise(resolve => setTimeout(resolve, 150));

	beforeAll(async () => {
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

	beforeEach(async () => {
		const { data, error } = await supabaseAdmin
			.from('playlists')
			.insert({
				name: `int-${randomUUID().slice(0, 8)}`,
				owner_id: owner.id,
				visibility: 'private',
				edit_mode: 'restricted',
				viewer_ids: [viewer.id],
			})
			.select('id')
			.single();
		if (error) throw error;
		playlistId = data.id;

		[ownerSocket, viewerSocket, outsiderSocket] = await Promise.all([
			connect(owner),
			connect(viewer),
			connect(outsider),
		]);
		await join(ownerSocket);
		await join(viewerSocket);
	});

	afterEach(() => {
		while (clients.length) clients.pop()?.disconnect();
	});

	afterAll(async () => {
		await getIO()?.close();
		await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
		for (const user of [owner, viewer, outsider]) {
			if (user) await supabaseAdmin.auth.admin.deleteUser(user.id); // cascades to playlists
		}
		await disconnectRedis();
	});

	it('sends the same versioned add to every client of the room', async () => {
		const outsiderUpdates = record(outsiderSocket);
		const received = bothReceive();
		const result = await tracks.addTrack(playlistId, owner.id, dto());

		const expected: PlaylistUpdatedPayload = {
			playlistId,
			tracksVersion: result.tracksVersion,
			rebalanced: result.rebalanced,
			event: 'track_added',
			track: result.track,
		};
		expect(await received).toEqual([expected, expected]);
		expect(result.track).toMatchObject({ addedBy: owner.id });
		await settle();
		expect(outsiderUpdates).toEqual([]);
	});

	it('sends the same versioned remove to every client of the room', async () => {
		const { track } = await tracks.addTrack(playlistId, owner.id, dto());
		await settle();

		const received = bothReceive();
		const result = await tracks.removeTrack(playlistId, owner.id, track.id);

		const expected: PlaylistUpdatedPayload = {
			playlistId,
			tracksVersion: result.tracksVersion,
			rebalanced: false,
			event: 'track_removed',
			trackId: track.id,
		};
		expect(await received).toEqual([expected, expected]);
	});

	it('sends the same version and rank of a move, equal to the playlist fetch', async () => {
		const first = await tracks.addTrack(playlistId, owner.id, dto());
		const second = await tracks.addTrack(playlistId, owner.id, dto());
		await settle();

		const outsiderUpdates = record(outsiderSocket);
		const received = bothReceive();
		await tracks.moveTrack(playlistId, owner.id, second.track.id, {
			afterRank: null,
			expectedVersion: second.tracksVersion,
		});

		const [ownerEvent, viewerEvent] = await received;
		expect(viewerEvent).toEqual(ownerEvent);

		const fetched = await playlistService.getPlaylistById(playlistId, owner.id);
		const moved = fetched.tracks.find(t => t.id === second.track.id);
		expect(ownerEvent).toEqual({
			playlistId,
			tracksVersion: fetched.tracksVersion,
			rebalanced: false,
			event: 'track_moved',
			trackId: second.track.id,
			rank: moved?.rank,
		});
		expect(fetched.tracks.map(t => t.id)).toEqual([second.track.id, first.track.id]);
		await settle();
		expect(outsiderUpdates).toEqual([]);
	});

	it('emits nothing for a refused move', async () => {
		const { track, tracksVersion } = await tracks.addTrack(playlistId, owner.id, dto());
		await tracks.addTrack(playlistId, owner.id, dto());
		const move = { afterRank: null, expectedVersion: tracksVersion + 1 };
		await tracks.moveTrack(playlistId, owner.id, track.id, move);
		await settle();

		const ownerUpdates = record(ownerSocket);
		const viewerUpdates = record(viewerSocket);
		// Same move again on the version before the first one: 409 TRACK_MOVED_CONCURRENTLY.
		await expect(tracks.moveTrack(playlistId, owner.id, track.id, move)).rejects.toMatchObject({
			statusCode: 409,
		});
		await settle();
		expect(ownerUpdates).toEqual([]);
		expect(viewerUpdates).toEqual([]);
	});

	it('sends the new details to every client of the room after an update (#342)', async () => {
		const received = Promise.all(
			[ownerSocket, viewerSocket].map(
				s => new Promise<PlaylistDetailsPayload>(resolve => s.once('playlist:details', resolve))
			)
		);
		await playlistUpdateService.updatePlaylist(playlistId, owner.id, {
			name: 'Les tubes du Crabe Croustillant',
			description: 'desc',
		});

		const expected: PlaylistDetailsPayload = {
			playlistId,
			name: 'Les tubes du Crabe Croustillant',
			description: 'desc',
			visibility: 'private',
			editMode: 'restricted',
		};
		expect(await received).toEqual([expected, expected]);
	});

	it('tells every client of the room about a deletion before evicting them (#342)', async () => {
		const received = Promise.all(
			[ownerSocket, viewerSocket].map(
				s => new Promise<PlaylistDeletedPayload>(resolve => s.once('playlist:deleted', resolve))
			)
		);
		await playlistUpdateService.deletePlaylist(playlistId, owner.id);

		expect(await received).toEqual([{ playlistId }, { playlistId }]);
		await vi.waitFor(async () => expect(await inRoom(viewerSocket)).toBe(false));
	});
});
