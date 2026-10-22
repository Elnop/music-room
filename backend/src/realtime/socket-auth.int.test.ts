import { createHash, randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import {
	connectRedis,
	disconnectRedis,
	isRedisConnected,
	redisClient,
} from '@/shared/config/redis.js';
import { logger } from '@/shared/utils/logger.js';
import * as sessionService from '@/features/auth/services/session.service.js';
import type { UserListeningStatus } from '@/realtime/listening.types.js';
import * as socketServer from '@/realtime/socket-server.js';
import { getIO } from '@/realtime/state.js';
import * as realtime from '@/realtime/emitters/control.emitters.js';

// Socket.io handshake authentication (socket-auth.ts) against a real server
// on a random port and real users/tokens from the local Supabase stack.

interface TestUser {
	id: string;
	token: string;
}

const PASSWORD = 'integration-test-password';

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

	// Sign in with the anon client, never the admin one (#136).
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	return { id, token: session.session.access_token };
}

function deviceFields(deviceId = `dev-${randomUUID()}`) {
	return {
		deviceId,
		deviceName: 'Test device',
		platform: 'android',
		model: 'Pixel Test',
		appVersion: '1.0.0',
	};
}

/** A syntactically valid JWT whose `exp` is in the past (unsigned). */
function expiredJwt(sub: string): string {
	const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
	const now = Math.floor(Date.now() / 1000);
	return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
		sub,
		role: 'authenticated',
		aud: 'authenticated',
		iat: now - 7200,
		exp: now - 3600,
	})}.${Buffer.from('invalid-signature').toString('base64url')}`;
}

describe('Socket.io handshake authentication', () => {
	let httpServer: HTTPServer;
	let url: string;
	let alice: TestUser;
	let bob: TestUser;
	const clients: ClientSocket[] = [];

	function connect(auth: Record<string, unknown>): ClientSocket {
		const socket = ioClient(url, {
			auth,
			transports: ['websocket'],
			reconnection: false,
			forceNew: true,
		});
		clients.push(socket);
		return socket;
	}

	function connected(socket: ClientSocket): Promise<void> {
		return new Promise((resolve, reject) => {
			socket.once('connect', () => resolve());
			socket.once('connect_error', err => reject(err));
		});
	}

	function refused(socket: ClientSocket): Promise<string> {
		return new Promise((resolve, reject) => {
			socket.once('connect', () => reject(new Error('connection was accepted')));
			socket.once('connect_error', err => resolve(err.message));
		});
	}

	function nextEvent<T>(
		socket: ClientSocket,
		event: string,
		match: (payload: T) => boolean = () => true
	): Promise<T> {
		return new Promise(resolve => {
			const handler = (payload: T) => {
				if (!match(payload)) return;
				socket.off(event, handler);
				resolve(payload);
			};
			socket.on(event, handler);
		});
	}

	async function serverSocket(clientId: string | undefined) {
		const sockets = await getIO()!.fetchSockets();
		const found = sockets.find(s => s.id === clientId);
		if (!found) throw new Error('server socket not found');
		return found;
	}

	beforeAll(async () => {
		// verifyToken checks the logout denylist and fails closed without Redis.
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');
		// Invalid-token handshakes below count against 127.0.0.1 (#160): start
		// from a clean counter so repeated runs never reach the limit.
		const tokenKeys = await redisClient.keys('rl:auth:token:*');
		if (tokenKeys.length > 0) await redisClient.del(...tokenKeys);

		alice = await createUser();
		bob = await createUser();

		// Mutual friends, and follows(bob -> alice, can_control_music): alice
		// lets bob control her music.
		const { error } = await supabaseAdmin.from('follows').insert([
			{ follower_id: bob.id, following_id: alice.id, can_control_music: true },
			{ follower_id: alice.id, following_id: bob.id },
		]);
		if (error) throw error;

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
		// Cascades to user_profiles and follows.
		if (alice) await supabaseAdmin.auth.admin.deleteUser(alice.id);
		if (bob) await supabaseAdmin.auth.admin.deleteUser(bob.id);
		await disconnectRedis();
	});

	it('accepts a valid handshake: identity from the token, user room joined', async () => {
		const device = deviceFields();
		const socket = connect({ token: alice.token, ...device });
		await connected(socket);

		const server = await serverSocket(socket.id);
		expect(server.data.userId).toBe(alice.id);
		expect(server.data.device).toEqual({
			deviceId: device.deviceId,
			deviceName: device.deviceName,
			platform: device.platform,
			model: device.model,
		});
		expect(server.data.appVersion).toBe(device.appVersion);
		expect(server.rooms.has(`user:${alice.id}`)).toBe(true);
	});

	it('logs each incoming event with the handshake platform, device and app version', async () => {
		const device = deviceFields();
		const socket = connect({ token: alice.token, ...device });
		await connected(socket);
		const info = vi.spyOn(logger, 'info');

		try {
			// Wait for the reply so the event has been handled (and logged).
			const answered = nextEvent(socket, 'listening:error');
			socket.emit('listening:subscribe', 'not-a-uuid');
			await answered;

			expect(info).toHaveBeenCalledWith('[Socket] in:listening:subscribe', {
				socketId: socket.id,
				userId: alice.id,
				platform: device.platform,
				device: device.model,
				deviceId: device.deviceId,
				appVersion: device.appVersion,
			});
			// Event arguments are never logged.
			expect(JSON.stringify(info.mock.calls)).not.toContain('not-a-uuid');
		} finally {
			info.mockRestore();
		}
	});

	it('registers the handshake device: a control:action from a friend reaches it', async () => {
		const device = deviceFields();
		const target = connect({ token: alice.token, ...device });
		const controller = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(target), connected(controller)]);

		const command = nextEvent<{ action: string; fromUserId: string }>(target, 'control:command');
		controller.emit('control:action', {
			targetUserId: alice.id,
			targetDeviceId: device.deviceId,
			action: 'pause',
		});

		await expect(command).resolves.toEqual({ action: 'pause', fromUserId: bob.id });
	});

	it('keeps a reconnected device online when its old socket disconnects', async () => {
		const device = deviceFields();
		const first = connect({ token: alice.token, ...device });
		await connected(first);
		const second = connect({ token: alice.token, ...device });
		const controller = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(second), connected(controller)]);

		const firstId = first.id;
		first.disconnect();
		await vi.waitFor(async () => {
			const sockets = await getIO()!.fetchSockets();
			expect(sockets.some(s => s.id === firstId)).toBe(false);
		});

		const command = nextEvent<{ action: string; fromUserId: string }>(second, 'control:command');
		controller.emit('control:action', {
			targetUserId: alice.id,
			targetDeviceId: device.deviceId,
			action: 'pause',
		});

		await expect(command).resolves.toEqual({ action: 'pause', fromUserId: bob.id });
	});

	it("carries the owner's chosen name instead of the handshake one (#352)", async () => {
		const device = deviceFields();
		await connected(connect({ token: alice.token, ...device }));
		const { error } = await supabaseAdmin
			.from('devices')
			.update({ custom_name: 'Salon' })
			.eq('user_id', alice.id)
			.eq('device_id', device.deviceId);
		if (error) throw error;

		const socket = connect({ token: alice.token, ...device });
		await connected(socket);

		const server = await serverSocket(socket.id);
		expect(server.data.device.deviceName).toBe('Salon');
		const { data } = await supabaseAdmin
			.from('devices')
			.select('device_name, custom_name')
			.eq('user_id', alice.id)
			.eq('device_id', device.deviceId)
			.single();
		expect(data).toEqual({ device_name: device.deviceName, custom_name: 'Salon' });
	});

	it('gives a live socket the new name on rename (#352)', async () => {
		const device = deviceFields();
		const socket = connect({ token: alice.token, ...device });
		await connected(socket);

		realtime.setDeviceName(alice.id, device.deviceId, 'Cuisine');

		const server = await serverSocket(socket.id);
		expect(server.data.device.deviceName).toBe('Cuisine');
	});

	it("sends the renamed device's status to listeners at once (#352)", async () => {
		const device = deviceFields();
		const owner = connect({ token: alice.token, ...device });
		const watcher = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(owner), connected(watcher)]);

		const initial = nextEvent<UserListeningStatus>(watcher, 'listening:status');
		watcher.emit('listening:subscribe', alice.id);
		await initial;

		// A paused device: no further listening:update would carry the name.
		const stored = nextEvent<UserListeningStatus>(watcher, 'listening:status', status =>
			status.devices.some(d => d.device.deviceId === device.deviceId)
		);
		owner.emit('listening:update', { track: null, isPlaying: false });
		await stored;

		const renamed = nextEvent<UserListeningStatus>(watcher, 'listening:status', status =>
			status.devices.some(d => d.device.deviceName === 'Cuisine')
		);
		realtime.setDeviceName(alice.id, device.deviceId, 'Cuisine');

		const status = await renamed;
		expect(status.ownerId).toBe(alice.id);
		expect(status.devices.find(d => d.device.deviceId === device.deviceId)?.device).toEqual({
			deviceId: device.deviceId,
			deviceName: 'Cuisine',
			platform: device.platform,
			model: device.model,
		});
	});

	it('refuses a handshake without token with NO_TOKEN', async () => {
		await expect(refused(connect({}))).resolves.toBe('NO_TOKEN');
		await expect(refused(connect({ ...deviceFields() }))).resolves.toBe('NO_TOKEN');
	});

	it('refuses a missing or non-string device field with INVALID_HANDSHAKE', async () => {
		const { model: _model, ...withoutModel } = deviceFields();
		await expect(refused(connect({ token: alice.token, ...withoutModel }))).resolves.toBe(
			'INVALID_HANDSHAKE'
		);
		await expect(
			refused(connect({ token: alice.token, ...deviceFields(), platform: 42 }))
		).resolves.toBe('INVALID_HANDSHAKE');
		// devices.device_id holds at most 128 characters (015_devices.sql).
		await expect(
			refused(connect({ token: alice.token, ...deviceFields(), deviceId: 'd'.repeat(129) }))
		).resolves.toBe('INVALID_HANDSHAKE');
	});

	it('refuses an invalid or expired token with INVALID_TOKEN', async () => {
		await expect(refused(connect({ token: 'garbage', ...deviceFields() }))).resolves.toBe(
			'INVALID_TOKEN'
		);
		await expect(
			refused(connect({ token: expiredJwt(alice.id), ...deviceFields() }))
		).resolves.toBe('INVALID_TOKEN');
	});

	it('refuses a token revoked by logout with INVALID_TOKEN (#71)', async () => {
		// A user of its own: the shared users' tokens must stay valid.
		const carol = await createUser();
		try {
			await connected(connect({ token: carol.token, ...deviceFields() }));

			await sessionService.logout(carol.token, carol.id);

			// logout also ends the Supabase session, and the handshake maps every
			// verification failure to INVALID_TOKEN (503 REVOCATION_UNAVAILABLE too):
			// check the handshake's own denylist lookup found the token revoked,
			// with Redis healthy, and Supabase was never asked.
			expect(isRedisConnected()).toBe(true);
			const revokedKey = `auth:revoked:${createHash('sha256').update(carol.token).digest('hex')}`;
			const exists = vi.spyOn(redisClient, 'exists');
			const getUser = vi.spyOn(supabaseAdmin.auth, 'getUser');
			await expect(refused(connect({ token: carol.token, ...deviceFields() }))).resolves.toBe(
				'INVALID_TOKEN'
			);
			expect(exists).toHaveBeenCalledTimes(1);
			expect(exists).toHaveBeenCalledWith(revokedKey);
			await expect(exists.mock.results[0].value).resolves.toBe(1);
			expect(getUser).not.toHaveBeenCalled();
		} finally {
			vi.restoreAllMocks();
			await supabaseAdmin.auth.admin.deleteUser(carol.id);
		}
	});

	describe('device registration (devices table)', () => {
		async function deviceRows(deviceId: string) {
			const { data, error } = await supabaseAdmin
				.from('devices')
				.select('*')
				.eq('device_id', deviceId);
			if (error) throw error;
			return data;
		}

		it('records the handshake device on the first connection', async () => {
			const device = deviceFields();
			const before = Date.now();
			await connected(connect({ token: alice.token, ...device }));

			const rows = await deviceRows(device.deviceId);
			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({
				user_id: alice.id,
				device_id: device.deviceId,
				device_name: device.deviceName,
				platform: device.platform,
				model: device.model,
			});
			expect(new Date(rows[0].last_seen_at).getTime()).toBeGreaterThanOrEqual(before);
		});

		it('keeps one row on reconnection: last_seen_at and fields updated, created_at kept', async () => {
			const device = deviceFields();
			const first = connect({ token: alice.token, ...device });
			await connected(first);
			const [initial] = await deviceRows(device.deviceId);
			first.disconnect();

			await new Promise(resolve => setTimeout(resolve, 20));
			await connected(
				connect({
					token: alice.token,
					...device,
					deviceName: 'Renamed device',
					model: 'Pixel Next',
				})
			);

			const rows = await deviceRows(device.deviceId);
			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({ device_name: 'Renamed device', model: 'Pixel Next' });
			expect(rows[0].created_at).toBe(initial.created_at);
			expect(new Date(rows[0].last_seen_at).getTime()).toBeGreaterThan(
				new Date(initial.last_seen_at).getTime()
			);
		});

		it('keeps one row per user when two accounts share a deviceId', async () => {
			const device = deviceFields();
			await connected(connect({ token: alice.token, ...device }));
			await connected(connect({ token: bob.token, ...device }));

			const rows = await deviceRows(device.deviceId);
			expect(rows.map(row => row.user_id).sort()).toEqual([alice.id, bob.id].sort());
		});

		it('writes no row for a handshake refused with INVALID_TOKEN', async () => {
			const device = deviceFields();
			await expect(refused(connect({ token: 'garbage', ...device }))).resolves.toBe(
				'INVALID_TOKEN'
			);

			await expect(deviceRows(device.deviceId)).resolves.toEqual([]);
		});
	});

	it('ignores a forged userId in the handshake', async () => {
		const socket = connect({ token: alice.token, ...deviceFields(), userId: bob.id });
		await connected(socket);

		const server = await serverSocket(socket.id);
		expect(server.data.userId).toBe(alice.id);
		expect(server.rooms.has(`user:${bob.id}`)).toBe(false);
	});

	it('ignores the legacy auth:register event', async () => {
		const spoofDeviceId = `spoof-${randomUUID()}`;
		const intruder = connect({ token: bob.token, ...deviceFields() });
		const controller = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(intruder), connected(controller)]);

		intruder.emit('auth:register', {
			userId: alice.id,
			device: { deviceId: spoofDeviceId, deviceName: 'x', platform: 'x', model: 'x' },
		});

		// Round-trip on the intruder's own socket so auth:register was processed
		// before the controller asks for the device (bob cannot control a stranger).
		const ack = nextEvent<{ code: string }>(intruder, 'listening:error');
		intruder.emit('listening:subscribe', randomUUID());
		await ack;

		// Nothing registered: the spoofed device is unknown to control:action.
		const error = nextEvent<{ code: string }>(controller, 'control:error');
		controller.emit('control:action', {
			targetUserId: alice.id,
			targetDeviceId: spoofDeviceId,
			action: 'pause',
		});
		await expect(error).resolves.toMatchObject({ code: 'DEVICE_OFFLINE' });

		const server = await serverSocket(intruder.id);
		expect(server.data.userId).toBe(bob.id);
		expect(server.rooms.has(`user:${alice.id}`)).toBe(false);
	});

	it('stores listening:update with the handshake device, not the payload one', async () => {
		const device = deviceFields();
		const owner = connect({ token: alice.token, ...device });
		const watcher = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(owner), connected(watcher)]);

		const initial = nextEvent<UserListeningStatus>(watcher, 'listening:status');
		watcher.emit('listening:subscribe', alice.id);
		await initial;

		const update = nextEvent<UserListeningStatus>(watcher, 'listening:status', status =>
			status.devices.some(d => d.isPlaying)
		);
		owner.emit('listening:update', {
			device: { deviceId: 'spoofed', deviceName: 'Spoofed', platform: 'x', model: 'x' },
			track: null,
			isPlaying: true,
		});

		const status = await update;
		expect(status.ownerId).toBe(alice.id);
		expect(status.devices).toHaveLength(1);
		expect(status.devices[0].device).toEqual({
			deviceId: device.deviceId,
			deviceName: device.deviceName,
			platform: device.platform,
			model: device.model,
		});
	});

	it('keeps the latest listening:update of a burst (#151)', async () => {
		const device = deviceFields();
		const owner = connect({ token: alice.token, ...device });
		const watcher = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(owner), connected(watcher)]);

		const initial = nextEvent<UserListeningStatus>(watcher, 'listening:status');
		watcher.emit('listening:subscribe', alice.id);
		await initial;

		const ownDevice = (status: UserListeningStatus) =>
			status.devices.find(d => d.device.deviceId === device.deviceId);
		const paused = nextEvent<UserListeningStatus>(
			watcher,
			'listening:status',
			status => ownDevice(status)?.isPlaying === false
		);
		const playing = nextEvent<UserListeningStatus>(
			watcher,
			'listening:status',
			status => ownDevice(status)?.isPlaying === true
		);
		owner.emit('listening:update', { track: null, isPlaying: false });
		owner.emit('listening:update', { track: null, isPlaying: true });

		await paused;
		const status = await playing;
		expect(ownDevice(status)?.isPlaying).toBe(true);
	});

	it('keeps the pending listening:update when an invalid one arrives in the window', async () => {
		const device = deviceFields();
		const owner = connect({ token: alice.token, ...device });
		const watcher = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(owner), connected(watcher)]);

		const initial = nextEvent<UserListeningStatus>(watcher, 'listening:status');
		watcher.emit('listening:subscribe', alice.id);
		await initial;

		const playing = nextEvent<UserListeningStatus>(watcher, 'listening:status', status =>
			status.devices.some(d => d.device.deviceId === device.deviceId && d.isPlaying === true)
		);
		owner.emit('listening:update', { track: null, isPlaying: false });
		owner.emit('listening:update', { track: null, isPlaying: true });
		owner.emit('listening:update', { track: null, isPlaying: 'yes' });

		await expect(playing).resolves.toBeDefined();
	});

	it('answers INVALID_PAYLOAD to a listening:update with a title too long (#204)', async () => {
		const owner = connect({ token: alice.token, ...deviceFields() });
		await connected(owner);

		const error = nextEvent<{ code: string }>(owner, 'listening:error');
		owner.emit('listening:update', {
			track: { id: 1, title: 'x'.repeat(301), artist: 'a', artworkUrl: null },
			isPlaying: true,
		});
		await expect(error).resolves.toMatchObject({ code: 'INVALID_PAYLOAD' });
	});

	it('refuses events past the per-socket limit with RATE_LIMITED (#204)', async () => {
		const socket = connect({ token: bob.token, ...deviceFields() });
		await connected(socket);

		// control:action allows 20 per 10 s: malformed payloads answer
		// INVALID_PAYLOAD up to there, the 21st is refused before validation.
		const codes: string[] = [];
		socket.on('control:error', (err: { code: string }) => codes.push(err.code));
		for (let i = 0; i < 21; i++) socket.emit('control:action', {});
		await vi.waitFor(() => expect(codes).toHaveLength(21));
		// The refusal can arrive before earlier answers: count, not order.
		expect(codes.filter(code => code === 'INVALID_PAYLOAD')).toHaveLength(20);
		expect(codes.filter(code => code === 'RATE_LIMITED')).toHaveLength(1);

		// Counted per socket: another socket of the same user is not limited.
		const other = connect({ token: bob.token, ...deviceFields() });
		await connected(other);
		const answer = nextEvent<{ code: string }>(other, 'control:error');
		other.emit('control:action', {});
		await expect(answer).resolves.toMatchObject({ code: 'INVALID_PAYLOAD' });
	});

	it('drops the pending listening:update when the device disconnects', async () => {
		const device = deviceFields();
		const owner = connect({ token: alice.token, ...device });
		const watcher = connect({ token: bob.token, ...deviceFields() });
		await Promise.all([connected(owner), connected(watcher)]);

		const initial = nextEvent<UserListeningStatus>(watcher, 'listening:status');
		watcher.emit('listening:subscribe', alice.id);
		await initial;

		const hasDevice = (status: UserListeningStatus) =>
			status.devices.some(d => d.device.deviceId === device.deviceId);
		const paused = nextEvent<UserListeningStatus>(watcher, 'listening:status', hasDevice);
		owner.emit('listening:update', { track: null, isPlaying: false });
		owner.emit('listening:update', { track: null, isPlaying: true });
		await paused;

		// `isPlaying: true` is now pending; the disconnect must discard it.
		const cleanup = nextEvent<UserListeningStatus>(
			watcher,
			'listening:status',
			status => !hasDevice(status)
		);
		owner.disconnect();
		await cleanup;

		const late: UserListeningStatus[] = [];
		const collect = (status: UserListeningStatus) => {
			if (hasDevice(status)) late.push(status);
		};
		watcher.on('listening:status', collect);
		await new Promise(resolve => setTimeout(resolve, 1500));
		watcher.off('listening:status', collect);

		expect(late).toEqual([]);
	});
});
