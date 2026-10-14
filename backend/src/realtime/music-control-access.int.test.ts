import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import { musicControlService } from '@/features/music-control/music-control.service.js';
import { controlAccessService } from '@/features/music-control/services/control-access.service.js';
import { deviceLicenseService } from '@/features/music-control/services/device-license.service.js';
import { FriendsService } from '@/features/friends/services/friends.service.js';
import type { UserListeningStatus } from '@/features/music-control/music-control.types.js';
import { realtime } from '@/realtime/index.js';

// Access to listening status and music control (music-control-access.ts,
// realtime/index.ts) against a real Socket.io server and the local Supabase
// stack. Alice owns the music; Bob and Dave are her mutual friends with her
// "all my devices" switch on; Erin is a mutual friend without switch or
// license; Carol does not follow her. Per-device licenses are added per test.

interface TestUser {
	id: string;
	token: string;
}

interface SocketError {
	message: string;
	code: string;
}

interface PermissionChanged {
	ownerId: string;
	targetUserId: string;
	canControl: boolean;
}

interface ControlCommand {
	action: string;
	fromUserId: string;
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

describe('Listening and control access', () => {
	let httpServer: HTTPServer;
	let url: string;
	let alice: TestUser;
	let bob: TestUser;
	let carol: TestUser;
	let dave: TestUser;
	let erin: TestUser;
	const clients: ClientSocket[] = [];

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

	function nextEvent<T>(socket: ClientSocket, event: string): Promise<T> {
		return new Promise(resolve => socket.once(event, (payload: T) => resolve(payload)));
	}

	/** Collect every payload of `event` a socket receives. */
	function record<T>(socket: ClientSocket, event: string): T[] {
		const received: T[] = [];
		socket.on(event, (payload: T) => received.push(payload));
		return received;
	}

	async function inListeningRoom(socket: ClientSocket, ownerId: string): Promise<boolean> {
		const sockets = await realtime.getIO()!.fetchSockets();
		const found = sockets.find(s => s.id === socket.id);
		return found?.rooms.has(`listening:${ownerId}`) ?? false;
	}

	/** Subscribe to the owner's listening status and wait for the first status. */
	async function subscribe(socket: ClientSocket, ownerId: string): Promise<UserListeningStatus> {
		const status = nextEvent<UserListeningStatus>(socket, 'listening:status');
		socket.emit('listening:subscribe', ownerId);
		return status;
	}

	/** Publish a listening update from a new device of Alice's (not throttled). */
	async function publishAliceStatus(positionMs?: number): Promise<string> {
		const deviceId = `dev-${randomUUID()}`;
		const device = await connect(alice, deviceId);
		device.emit('listening:update', { track: null, isPlaying: true, positionMs });
		return deviceId;
	}

	const hasDevice = (statuses: UserListeningStatus[], deviceId: string) =>
		statuses.some(s => s.devices.some(d => d.device.deviceId === deviceId));

	/** Leave time for a stray event to arrive after the expected ones. */
	const settle = () => new Promise(resolve => setTimeout(resolve, 150));

	async function setFollows(): Promise<void> {
		// Deleting the follows also drops their licenses (015 foreign key).
		const ids = [alice.id, bob.id, carol.id, dave.id, erin.id];
		await supabaseAdmin.from('follows').delete().in('follower_id', ids);
		const { error } = await supabaseAdmin.from('follows').insert([
			{ follower_id: bob.id, following_id: alice.id, can_control_music: true },
			{ follower_id: alice.id, following_id: bob.id },
			{ follower_id: dave.id, following_id: alice.id, can_control_music: true },
			{ follower_id: alice.id, following_id: dave.id },
			{ follower_id: erin.id, following_id: alice.id, can_control_music: false },
			{ follower_id: alice.id, following_id: erin.id },
		]);
		if (error) throw error;
	}

	/** Set Alice's "all my devices" switch for Bob. */
	async function setBobSwitch(on: boolean): Promise<void> {
		const { error } = await supabaseAdmin
			.from('follows')
			.update({ can_control_music: on })
			.eq('follower_id', bob.id)
			.eq('following_id', alice.id);
		if (error) throw error;
	}

	/** License Bob on Alice's device (the device row exists once it connected). */
	async function licenseBob(deviceId: string): Promise<void> {
		const { error } = await supabaseAdmin
			.from('device_control_licenses')
			.insert({ owner_id: alice.id, device_id: deviceId, grantee_id: bob.id });
		if (error) throw error;
	}

	/** Alice stops following Bob: Bob's switch row stays, but they are no longer friends. */
	async function aliceDropsBob(): Promise<void> {
		const { error } = await supabaseAdmin
			.from('follows')
			.delete()
			.eq('follower_id', alice.id)
			.eq('following_id', bob.id);
		if (error) throw error;
	}

	/** Send a control action and wait for its success or error. */
	async function control(
		socket: ClientSocket,
		targetDeviceId: string
	): Promise<{ ok: true } | { ok: false; error: SocketError }> {
		const outcome = new Promise<{ ok: true } | { ok: false; error: SocketError }>(resolve => {
			socket.once('control:success', () => resolve({ ok: true }));
			socket.once('control:error', (error: SocketError) => resolve({ ok: false, error }));
		});
		socket.emit('control:action', { targetUserId: alice.id, targetDeviceId, action: 'pause' });
		const result = await outcome;
		socket.off('control:success');
		socket.off('control:error');
		return result;
	}

	beforeAll(async () => {
		// verifyToken checks the logout denylist and fails closed without Redis.
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		[alice, bob, carol, dave, erin] = await Promise.all([
			createUser(),
			createUser(),
			createUser(),
			createUser(),
			createUser(),
		]);

		httpServer = createServer();
		realtime.initialize(httpServer);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		const { port } = httpServer.address() as AddressInfo;
		url = `http://127.0.0.1:${port}`;
	});

	beforeEach(async () => {
		await setFollows();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		while (clients.length) clients.pop()?.disconnect();
		// Let the server drop the sockets so their disconnect broadcasts do not
		// reach the next test.
		await vi.waitFor(async () => expect(await realtime.getIO()!.fetchSockets()).toHaveLength(0));
	});

	afterAll(async () => {
		await realtime.getIO()?.close();
		const users = [alice, bob, carol, dave, erin].filter(Boolean);
		if (users.length) {
			await supabaseAdmin
				.from('follows')
				.delete()
				.in(
					'follower_id',
					users.map(u => u.id)
				);
		}
		for (const user of users) await supabaseAdmin.auth.admin.deleteUser(user.id);
		await disconnectRedis();
	});

	describe('listening:subscribe', () => {
		it("sends the allowed follower Alice's status, then her updates", async () => {
			const bobSocket = await connect(bob);
			const initial = await subscribe(bobSocket, alice.id);
			expect(initial.ownerId).toBe(alice.id);
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(true);

			const statuses = record<UserListeningStatus>(bobSocket, 'listening:status');
			const deviceId = await publishAliceStatus();
			await vi.waitFor(() => expect(hasDevice(statuses, deviceId)).toBe(true));
		});

		it('relays positionMs in the status, null when the client sends none (#295)', async () => {
			const bobSocket = await connect(bob);
			await subscribe(bobSocket, alice.id);
			const statuses = record<UserListeningStatus>(bobSocket, 'listening:status');
			const withPos = await publishAliceStatus(42_000);
			const without = await publishAliceStatus();
			const positionOf = (id: string) =>
				statuses.flatMap(s => s.devices).find(d => d.device.deviceId === id)?.positionMs;
			await vi.waitFor(() => expect(positionOf(withPos)).toBe(42_000));
			await vi.waitFor(() => expect(positionOf(without)).toBeNull());
		});

		it.each([
			['does not follow Alice', () => carol],
			['is her mutual friend without switch or license', () => erin],
		])('refuses a user who %s with NOT_AUTHORIZED', async (_label, user) => {
			const [socket, daveSocket] = await Promise.all([connect(user()), connect(dave)]);
			await subscribe(daveSocket, alice.id);

			const statuses = record<UserListeningStatus>(socket, 'listening:status');
			const refusal = nextEvent<SocketError>(socket, 'listening:error');
			socket.emit('listening:subscribe', alice.id);
			await expect(refusal).resolves.toMatchObject({ code: 'NOT_AUTHORIZED' });
			expect(await inListeningRoom(socket, alice.id)).toBe(false);

			// Dave witnesses the broadcast; the refused user gets nothing.
			const daveStatuses = record<UserListeningStatus>(daveSocket, 'listening:status');
			const deviceId = await publishAliceStatus();
			await vi.waitFor(() => expect(hasDevice(daveStatuses, deviceId)).toBe(true));
			await settle();
			expect(statuses).toEqual([]);
		});

		it('handles subscribe then unsubscribe in order: the socket ends outside the room (#159)', async () => {
			const [bobSocket, daveSocket] = await Promise.all([connect(bob), connect(dave)]);
			await subscribe(daveSocket, alice.id);

			bobSocket.emit('listening:subscribe', alice.id);
			bobSocket.emit('listening:unsubscribe', alice.id);
			// Queued after the unsubscribe: once it answers, both were processed.
			const done = nextEvent<SocketError>(bobSocket, 'listening:error');
			bobSocket.emit('listening:subscribe', 'not-a-uuid');
			await expect(done).resolves.toMatchObject({ code: 'INVALID_PAYLOAD' });
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(false);

			// Dave witnesses the broadcast; Bob gets nothing.
			const bobStatuses = record<UserListeningStatus>(bobSocket, 'listening:status');
			const daveStatuses = record<UserListeningStatus>(daveSocket, 'listening:status');
			const deviceId = await publishAliceStatus();
			await vi.waitFor(() => expect(hasDevice(daveStatuses, deviceId)).toBe(true));
			await settle();
			expect(bobStatuses).toEqual([]);
		});

		it.each([
			['not a UUID', 'alice'],
			['a number', 42],
			['null', null],
			['an object', { targetUserId: randomUUID() }],
		])('refuses a payload that is %s with INVALID_PAYLOAD, before any lookup', async (_l, p) => {
			const canControl = vi.spyOn(controlAccessService, 'getAccess');
			const socket = await connect(bob);

			const refusal = nextEvent<SocketError>(socket, 'listening:error');
			socket.emit('listening:subscribe', p);
			await expect(refusal).resolves.toMatchObject({ code: 'INVALID_PAYLOAD' });
			expect(canControl).not.toHaveBeenCalled();
			const sockets = await realtime.getIO()!.fetchSockets();
			const rooms = [...(sockets.find(s => s.id === socket.id)?.rooms ?? [])];
			expect(rooms.some(r => r.startsWith('listening:'))).toBe(false);
		});
	});

	describe('control:action', () => {
		it('lets the owner pause another of their own devices', async () => {
			const deviceA = `dev-${randomUUID()}`;
			const tv = await connect(alice, deviceA);
			const phone = await connect(alice);
			const command = nextEvent<ControlCommand>(tv, 'control:command');
			const outcome = nextEvent(phone, 'control:success');
			phone.emit('control:action', {
				targetUserId: alice.id,
				targetDeviceId: deviceA,
				action: 'pause',
			});
			await outcome;
			expect(await command).toMatchObject({ action: 'pause', fromUserId: alice.id });
		});

		it("delivers Bob's command to Alice's device, sent by Bob", async () => {
			const deviceId = `dev-${randomUUID()}`;
			const [aliceDevice, bobSocket] = await Promise.all([connect(alice, deviceId), connect(bob)]);

			const command = nextEvent<ControlCommand>(aliceDevice, 'control:command');
			const success = nextEvent(bobSocket, 'control:success');
			bobSocket.emit('control:action', {
				targetUserId: alice.id,
				targetDeviceId: deviceId,
				action: 'pause',
			});
			await expect(command).resolves.toEqual({ action: 'pause', fromUserId: bob.id });
			await expect(success).resolves.toMatchObject({
				action: 'pause',
				targetUserId: alice.id,
				targetDeviceId: deviceId,
			});
		});

		it('refuses Carol even when the payload claims to come from Bob', async () => {
			const deviceId = `dev-${randomUUID()}`;
			const [aliceDevice, carolSocket] = await Promise.all([
				connect(alice, deviceId),
				connect(carol),
			]);
			const commands = record<ControlCommand>(aliceDevice, 'control:command');

			const refusal = nextEvent<SocketError>(carolSocket, 'control:error');
			carolSocket.emit('control:action', {
				targetUserId: alice.id,
				targetDeviceId: deviceId,
				action: 'play',
				fromUserId: bob.id,
				controllerId: bob.id,
			});
			await expect(refusal).resolves.toMatchObject({ code: 'NOT_AUTHORIZED' });
			await settle();
			expect(commands).toEqual([]);
		});

		it('ignores a forged sender field from an allowed controller', async () => {
			const deviceId = `dev-${randomUUID()}`;
			const [aliceDevice, bobSocket] = await Promise.all([connect(alice, deviceId), connect(bob)]);

			const command = nextEvent<ControlCommand>(aliceDevice, 'control:command');
			bobSocket.emit('control:action', {
				targetUserId: alice.id,
				targetDeviceId: deviceId,
				action: 'play',
				fromUserId: carol.id,
			});
			await expect(command).resolves.toEqual({ action: 'play', fromUserId: bob.id });
		});

		it('answers malformed payloads with INVALID_PAYLOAD and keeps serving the socket', async () => {
			const deviceId = `dev-${randomUUID()}`;
			const [aliceDevice, bobSocket] = await Promise.all([connect(alice, deviceId), connect(bob)]);
			const commands = record<ControlCommand>(aliceDevice, 'control:command');
			const errors = record<SocketError>(bobSocket, 'control:error');

			const payloads: unknown[] = [
				null,
				{ targetUserId: alice.id, action: 'play' },
				{ targetUserId: alice.id, targetDeviceId: deviceId, action: 'skip' },
			];
			for (const payload of payloads) bobSocket.emit('control:action', payload);
			await vi.waitFor(() => expect(errors).toHaveLength(payloads.length));
			expect(errors.every(e => e.code === 'INVALID_PAYLOAD')).toBe(true);
			expect(commands).toEqual([]);

			// No crash: a valid action still goes through.
			const command = nextEvent<ControlCommand>(aliceDevice, 'control:command');
			bobSocket.emit('control:action', {
				targetUserId: alice.id,
				targetDeviceId: deviceId,
				action: 'play',
			});
			await expect(command).resolves.toEqual({ action: 'play', fromUserId: bob.id });
		});
	});

	describe('eviction from listening:<owner>', () => {
		it("removes Bob's sockets when Alice revokes his control", async () => {
			const [bobPhone, bobTablet, daveSocket] = await Promise.all([
				connect(bob),
				connect(bob),
				connect(dave),
			]);
			await Promise.all([
				subscribe(bobPhone, alice.id),
				subscribe(bobTablet, alice.id),
				subscribe(daveSocket, alice.id),
			]);

			const changed = nextEvent(bobPhone, 'permission:changed');
			await musicControlService.revokeControl(alice.id, bob.id);
			await expect(changed).resolves.toEqual({
				ownerId: alice.id,
				targetUserId: bob.id,
				canControl: false,
			});
			expect(await inListeningRoom(bobPhone, alice.id)).toBe(false);
			expect(await inListeningRoom(bobTablet, alice.id)).toBe(false);
			expect(await inListeningRoom(daveSocket, alice.id)).toBe(true);

			const phoneStatuses = record<UserListeningStatus>(bobPhone, 'listening:status');
			const tabletStatuses = record<UserListeningStatus>(bobTablet, 'listening:status');
			const daveStatuses = record<UserListeningStatus>(daveSocket, 'listening:status');
			const deviceId = await publishAliceStatus();
			await vi.waitFor(() => expect(hasDevice(daveStatuses, deviceId)).toBe(true));
			await settle();
			expect(phoneStatuses).toEqual([]);
			expect(tabletStatuses).toEqual([]);
		});

		it("removes Bob's sockets when he unfollows Alice", async () => {
			const [bobSocket, daveSocket] = await Promise.all([connect(bob), connect(dave)]);
			await Promise.all([subscribe(bobSocket, alice.id), subscribe(daveSocket, alice.id)]);

			await new FriendsService().unfollowUser(bob.id, alice.id);
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(false);
			expect(await inListeningRoom(daveSocket, alice.id)).toBe(true);

			const bobStatuses = record<UserListeningStatus>(bobSocket, 'listening:status');
			const daveStatuses = record<UserListeningStatus>(daveSocket, 'listening:status');
			const deviceId = await publishAliceStatus();
			await vi.waitFor(() => expect(hasDevice(daveStatuses, deviceId)).toBe(true));
			await settle();
			expect(bobStatuses).toEqual([]);
		});
	});

	describe('per-device access (story 4.5)', () => {
		/** Connect Alice's devices A and B, then Bob, with his switch off and a license on A. */
		async function bobLicensedOnA() {
			const [deviceA, deviceB] = [`dev-${randomUUID()}`, `dev-${randomUUID()}`];
			const [aliceA, aliceB, bobSocket] = await Promise.all([
				connect(alice, deviceA),
				connect(alice, deviceB),
				connect(bob),
			]);
			await setBobSwitch(false);
			await licenseBob(deviceA);
			return { deviceA, deviceB, aliceA, aliceB, bobSocket };
		}

		it('delivers to the licensed device only, until B is licensed or the switch is on', async () => {
			const { deviceA, deviceB, aliceA, aliceB, bobSocket } = await bobLicensedOnA();
			const commandsA = record<ControlCommand>(aliceA, 'control:command');
			const commandsB = record<ControlCommand>(aliceB, 'control:command');

			expect(await control(bobSocket, deviceA)).toEqual({ ok: true });
			await vi.waitFor(() => expect(commandsA).toHaveLength(1));

			const refused = await control(bobSocket, deviceB);
			expect(refused).toMatchObject({ ok: false, error: { code: 'NOT_AUTHORIZED' } });
			await settle();
			expect(commandsB).toEqual([]);

			await licenseBob(deviceB);
			expect(await control(bobSocket, deviceB)).toEqual({ ok: true });
			await vi.waitFor(() => expect(commandsB).toHaveLength(1));
		});

		it('lets the switch reach an unlicensed device', async () => {
			const { deviceB, aliceB, bobSocket } = await bobLicensedOnA();
			await setBobSwitch(true);
			const commandsB = record<ControlCommand>(aliceB, 'control:command');

			expect(await control(bobSocket, deviceB)).toEqual({ ok: true });
			await vi.waitFor(() => expect(commandsB).toHaveLength(1));
		});

		it('refuses B once the switch is cut, and still reaches the licensed A', async () => {
			const { deviceA, deviceB, aliceB, bobSocket } = await bobLicensedOnA();
			await setBobSwitch(true);
			await musicControlService.revokeControl(alice.id, bob.id);
			const commandsB = record<ControlCommand>(aliceB, 'control:command');

			const refused = await control(bobSocket, deviceB);
			expect(refused).toMatchObject({ ok: false, error: { code: 'NOT_AUTHORIZED' } });
			expect(await control(bobSocket, deviceA)).toEqual({ ok: true });
			await settle();
			expect(commandsB).toEqual([]);
		});

		it('refuses a stale switch once Alice no longer follows Bob', async () => {
			const deviceId = `dev-${randomUUID()}`;
			const [aliceDevice, bobSocket] = await Promise.all([connect(alice, deviceId), connect(bob)]);
			await aliceDropsBob();
			const commands = record<ControlCommand>(aliceDevice, 'control:command');

			const refused = await control(bobSocket, deviceId);
			expect(refused).toMatchObject({ ok: false, error: { code: 'NOT_AUTHORIZED' } });

			const subscribeRefusal = nextEvent<SocketError>(bobSocket, 'listening:error');
			bobSocket.emit('listening:subscribe', alice.id);
			await expect(subscribeRefusal).resolves.toMatchObject({ code: 'NOT_AUTHORIZED' });
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(false);
			await settle();
			expect(commands).toEqual([]);
		});

		it("subscribes through a license and receives all of Alice's devices", async () => {
			const { bobSocket } = await bobLicensedOnA();
			await subscribe(bobSocket, alice.id);
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(true);

			// A device Bob holds no license on still shows in the status.
			const statuses = record<UserListeningStatus>(bobSocket, 'listening:status');
			const deviceId = await publishAliceStatus();
			await vi.waitFor(() => expect(hasDevice(statuses, deviceId)).toBe(true));
		});

		it('evicts Bob when Alice revokes his last license', async () => {
			const { deviceA, bobSocket } = await bobLicensedOnA();
			await subscribe(bobSocket, alice.id);

			await deviceLicenseService.revoke(alice.id, deviceA, bob.id);
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(false);
		});

		it('evicts Bob when Alice cuts the switch and he holds no license', async () => {
			const bobSocket = await connect(bob);
			await subscribe(bobSocket, alice.id);

			await musicControlService.revokeControl(alice.id, bob.id);
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(false);
		});

		it('evicts Bob when Alice unfollows him', async () => {
			const { bobSocket } = await bobLicensedOnA();
			await subscribe(bobSocket, alice.id);

			await new FriendsService().unfollowUser(alice.id, bob.id);
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(false);
		});

		it('tells Bob when Alice grants him a license (#183)', async () => {
			const deviceA = `dev-${randomUUID()}`;
			await connect(alice, deviceA);
			const bobSocket = await connect(bob);
			await setBobSwitch(false);

			const changed = nextEvent<PermissionChanged>(bobSocket, 'permission:changed');
			await deviceLicenseService.grant(alice.id, deviceA, bob.id);
			expect(await changed).toEqual({ ownerId: alice.id, targetUserId: bob.id, canControl: true });
		});

		it('tells Bob when Alice revokes a license, with whether access remains (#183)', async () => {
			const { deviceA, deviceB, bobSocket } = await bobLicensedOnA();
			await licenseBob(deviceB);

			let changed = nextEvent<PermissionChanged>(bobSocket, 'permission:changed');
			await deviceLicenseService.revoke(alice.id, deviceA, bob.id);
			expect(await changed).toMatchObject({ ownerId: alice.id, canControl: true });

			changed = nextEvent<PermissionChanged>(bobSocket, 'permission:changed');
			await deviceLicenseService.revoke(alice.id, deviceB, bob.id);
			expect(await changed).toMatchObject({ ownerId: alice.id, canControl: false });
		});

		it('tells nobody when a revoke removes no license (#183)', async () => {
			const deviceA = `dev-${randomUUID()}`;
			await connect(alice, deviceA);
			const [bobSocket, carolSocket] = await Promise.all([connect(bob), connect(carol)]);
			const bobEvents = record<PermissionChanged>(bobSocket, 'permission:changed');
			const carolEvents = record<PermissionChanged>(carolSocket, 'permission:changed');

			await deviceLicenseService.revoke(alice.id, deviceA, bob.id);
			await deviceLicenseService.revoke(alice.id, deviceA, carol.id);
			await new Promise(resolve => setTimeout(resolve, 300));

			expect(bobEvents).toEqual([]);
			expect(carolEvents).toEqual([]);
		});

		it('keeps Bob subscribed when the switch is cut but a license remains', async () => {
			const { bobSocket } = await bobLicensedOnA();
			await setBobSwitch(true);
			await subscribe(bobSocket, alice.id);

			await musicControlService.revokeControl(alice.id, bob.id);
			expect(await inListeningRoom(bobSocket, alice.id)).toBe(true);
		});
	});
});
