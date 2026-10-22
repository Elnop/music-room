import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import * as queue from '@/features/queue/services/queue.service.js';
import * as playlistService from '@/features/playlists/services/playlist.service.js';
import * as playlistTrackService from '@/features/playlists/services/playlist-track.service.js';
import * as socketServer from '@/realtime/socket-server.js';
import { getIO } from '@/realtime/state.js';
import * as realtime from '@/realtime/emitters/queue.emitters.js';
import * as realtimeControl from '@/realtime/emitters/control.emitters.js';
import type { QueueState } from '@/features/queue/queue.types.js';

// queue:updated (#273, #277): every queue mutation sends the full state to all the
// sockets of its user (room user:<id>) and to no one else, through a real
// Socket.io server against the local Supabase stack.

interface TestUser {
	id: string;
	token: string;
}

const PASSWORD = 'integration-test-password';
const URI_PREFIX = `https://soundcloud.com/int-queue-socket/${randomUUID()}`;

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

describe('queue:updated broadcast', () => {
	let httpServer: HTTPServer;
	let url: string;
	let owner: TestUser;
	let other: TestUser;
	let phone: ClientSocket;
	let tablet: ClientSocket;
	let otherSocket: ClientSocket;
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

	async function connect(user: TestUser, deviceId = `dev-${randomUUID()}`): Promise<ClientSocket> {
		const socket = ioClient(url, {
			auth: {
				token: user.token,
				deviceId,
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

	/** Collect every queue:updated a socket receives. */
	function record(socket: ClientSocket): QueueState[] {
		const received: QueueState[] = [];
		socket.on('queue:updated', (state: QueueState) => received.push(state));
		return received;
	}

	/** The next queue:updated received by both devices of the owner. */
	function bothReceive(): Promise<QueueState[]> {
		return Promise.all(
			[phone, tablet].map(s => new Promise<QueueState>(resolve => s.once('queue:updated', resolve)))
		);
	}

	/** Leave time for a stray broadcast to arrive after the expected ones. */
	const settle = () => new Promise(resolve => setTimeout(resolve, 150));

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		owner = await createUser();
		other = await createUser();

		httpServer = createServer();
		socketServer.initialize(httpServer);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		const { port } = httpServer.address() as AddressInfo;
		url = `http://127.0.0.1:${port}`;
	});

	beforeEach(async () => {
		[phone, tablet, otherSocket] = await Promise.all([
			connect(owner),
			connect(owner),
			connect(other),
		]);
	});

	afterEach(() => {
		while (clients.length) clients.pop()?.disconnect();
	});

	afterAll(async () => {
		await getIO()?.close();
		for (const user of [owner, other]) {
			if (user) await supabaseAdmin.auth.admin.deleteUser(user.id); // cascades to queues
		}
		await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
		await disconnectRedis();
	});

	describe('queue:updated for delegates', () => {
		async function befriend(controllerId: string, ownerId: string, allDevices: boolean) {
			await supabaseAdmin.from('follows').delete().in('follower_id', [controllerId, ownerId]);
			const { error } = await supabaseAdmin.from('follows').insert([
				{ follower_id: controllerId, following_id: ownerId, can_control_music: allDevices },
				{ follower_id: ownerId, following_id: controllerId },
			]);
			if (error) throw error;
		}

		function subscribe(socket: ClientSocket, ownerId: string) {
			return new Promise<void>((resolve, reject) => {
				socket.once('listening:status', () => resolve());
				socket.once('listening:error', reject);
				socket.emit('listening:subscribe', ownerId);
			});
		}

		afterEach(async () => {
			await supabaseAdmin.from('follows').delete().in('follower_id', [owner.id, other.id]);
		});

		it('reaches a subscribed delegate', async () => {
			await befriend(other.id, owner.id, true);
			await subscribe(otherSocket, owner.id);
			const received = record(otherSocket);
			const state = await queue.addItem(owner.id, owner.id, dto());
			await settle();
			expect(received).toEqual([state]);
		});

		it('reaches a subscribed owner device once', async () => {
			await subscribe(phone, owner.id);
			const received = record(phone);
			const state = await queue.addItem(owner.id, owner.id, dto());
			await settle();
			expect(received).toEqual([state]);
		});

		it('stops reaching a delegate whose access was revoked, who gets control:revoked', async () => {
			await befriend(other.id, owner.id, true);
			await subscribe(otherSocket, owner.id);
			const revoked = new Promise(resolve => otherSocket.once('control:revoked', resolve));
			await supabaseAdmin
				.from('follows')
				.update({ can_control_music: false })
				.eq('follower_id', other.id)
				.eq('following_id', owner.id);
			await realtimeControl.revalidateListeningAccess(other.id, owner.id);
			expect(await revoked).toEqual({ ownerId: owner.id });
			const received = record(otherSocket);
			await queue.addItem(owner.id, owner.id, dto());
			await settle();
			expect(received).toEqual([]);
		});

		it('sends a play-item command to the one device named', async () => {
			const deviceId = `dev-${randomUUID()}`;
			const target = await connect(owner, deviceId);
			const commands: unknown[] = [];
			target.on('control:command', c => commands.push(c));
			const phoneCommands: unknown[] = [];
			phone.on('control:command', c => phoneCommands.push(c));
			const state = await queue.addItem(owner.id, owner.id, dto());
			const command = {
				action: 'play-item' as const,
				fromUserId: other.id,
				item: state.items[0],
				positionMs: 0,
				version: state.version,
			};
			expect(realtime.sendDeviceCommand(owner.id, deviceId, command)).toBe(true);
			expect(realtime.sendDeviceCommand(owner.id, 'offline-device', command)).toBe(false);
			await settle();
			expect(commands).toEqual([command]);
			expect(phoneCommands).toEqual([]);
		});

		it('sends play-track and pause commands to the one device named', async () => {
			const deviceId = `dev-${randomUUID()}`;
			const target = await connect(owner, deviceId);
			const commands: unknown[] = [];
			target.on('control:command', c => commands.push(c));
			const track = {
				trackUri: 'https://soundcloud.com/a/b',
				title: 'B',
				artist: 'A',
				album: null,
				albumArt: null,
				durationMs: 1000,
			};
			const playTrack = {
				action: 'play-track' as const,
				fromUserId: other.id,
				track,
				positionMs: 1200,
			};
			const pause = { action: 'pause' as const, fromUserId: other.id };
			expect(realtime.sendDeviceCommand(owner.id, deviceId, playTrack)).toBe(true);
			expect(realtime.sendDeviceCommand(owner.id, deviceId, pause)).toBe(true);
			await settle();
			expect(commands).toEqual([playTrack, pause]);
		});
	});

	it('sends the new state of an add to both devices of the user and to no one else', async () => {
		const otherUpdates = record(otherSocket);
		const received = bothReceive();
		const state = await queue.addItem(owner.id, owner.id, dto());

		expect(await received).toEqual([state, state]);
		expect(state.items.at(-1)?.track.trackUri).toBe(`${URI_PREFIX}/${trackCount}`);
		await settle();
		expect(otherUpdates).toEqual([]);
	});

	it('sends the state of every mutation, equal to the fetch', async () => {
		const otherUpdates = record(otherSocket);
		await queue.addItem(owner.id, owner.id, dto());
		await settle();

		let received = bothReceive();
		await queue.step(owner.id, owner.id, 'next');
		const [afterStep] = await received;
		expect(afterStep).toEqual(await queue.getQueue(owner.id, owner.id));

		received = bothReceive();
		await queue.removeItem(owner.id, owner.id, afterStep.currentItemId!);
		const [afterRemove] = await received;
		expect(afterRemove).toEqual(await queue.getQueue(owner.id, owner.id));
		await settle();
		expect(otherUpdates).toEqual([]);
	});

	it('emits nothing for a refused operation', async () => {
		await settle();
		const phoneUpdates = record(phone);
		await expect(queue.playItem(owner.id, owner.id, randomUUID())).rejects.toMatchObject({
			statusCode: 404,
		});
		await settle();
		expect(phoneUpdates).toEqual([]);
	});

	it('sends the block of a played playlist to both devices, and nothing for an empty one', async () => {
		const otherUpdates = record(otherSocket);
		const { id } = await playlistService.createPlaylist(owner.id, { name: 'int-play' });
		await playlistTrackService.addTrack(id, owner.id, dto());
		await playlistTrackService.addTrack(id, owner.id, dto());

		const received = bothReceive();
		const state = await queue.playPlaylist(owner.id, owner.id, id);
		expect(await received).toEqual([state, state]);
		const block = state.items.filter(item => item.sourcePlaylistId === id);
		expect(block).toHaveLength(2);
		expect(state.currentItemId).toBe(block[0].id);

		const { id: emptyId } = await playlistService.createPlaylist(owner.id, { name: 'int-empty' });
		await settle();
		const phoneUpdates = record(phone);
		await expect(queue.playPlaylist(owner.id, owner.id, emptyId)).rejects.toMatchObject({
			statusCode: 409,
			code: 'PLAYLIST_EMPTY',
		});
		await settle();
		expect(phoneUpdates).toEqual([]);
		expect(otherUpdates).toEqual([]);
	});
});
