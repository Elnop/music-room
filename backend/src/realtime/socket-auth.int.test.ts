import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import type { UserListeningStatus } from '@/features/music-control/music-control.types.js';
import { realtime } from '@/realtime/index.js';

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
		const sockets = await realtime.getIO()!.fetchSockets();
		const found = sockets.find(s => s.id === clientId);
		if (!found) throw new Error('server socket not found');
		return found;
	}

	beforeAll(async () => {
		// verifyToken checks the logout denylist and fails closed without Redis.
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		alice = await createUser();
		bob = await createUser();

		// follows(bob -> alice, can_control_music): alice lets bob control her music.
		const { error } = await supabaseAdmin
			.from('follows')
			.insert({ follower_id: bob.id, following_id: alice.id, can_control_music: true });
		if (error) throw error;

		httpServer = createServer();
		realtime.initialize(httpServer);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		const { port } = httpServer.address() as AddressInfo;
		url = `http://127.0.0.1:${port}`;
	});

	afterEach(() => {
		while (clients.length) clients.pop()?.disconnect();
	});

	afterAll(async () => {
		await realtime.getIO()?.close();
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
			const sockets = await realtime.getIO()!.fetchSockets();
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
		// before the controller asks for the device (bob cannot control himself).
		const ack = nextEvent<{ code: string }>(intruder, 'listening:error');
		intruder.emit('listening:subscribe', bob.id);
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
