import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Fixed before env.ts loads (dotenv never overrides a set variable), so a local .env cannot change
// the allowed list; a TUNNEL_URL from .env may still be added but never matches the origins below.
vi.hoisted(() => {
	process.env.ALLOWED_ORIGINS = 'http://allowed.example';
	process.env.NODE_ENV = 'test';
});

const { supabaseAdmin, supabaseAnon } = await import('@/shared/config/supabase.js');
const { connectRedis, disconnectRedis, isRedisConnected } =
	await import('@/shared/config/redis.js');
const socketServer = await import('@/realtime/socket-server.js');
const { getIO } = await import('@/realtime/state.js');

// Same ALLOWED_ORIGINS rule as the HTTP API, on both transports.

const PASSWORD = 'integration-test-password';

describe('Socket.io origin check', () => {
	let httpServer: HTTPServer;
	let url: string;
	let userId: string;
	let token: string;
	const clients: ClientSocket[] = [];

	function connect(transport: 'websocket' | 'polling', origin?: string): ClientSocket {
		const socket = ioClient(url, {
			auth: {
				token,
				deviceId: `dev-${randomUUID()}`,
				deviceName: 'Test device',
				platform: 'android',
				model: 'Pixel Test',
				appVersion: '1.0.0',
			},
			transports: [transport],
			extraHeaders: origin ? { Origin: origin } : {},
			reconnection: false,
			forceNew: true,
		});
		clients.push(socket);
		return socket;
	}

	function outcome(socket: ClientSocket): Promise<'connected' | 'refused'> {
		return new Promise(resolve => {
			socket.once('connect', () => resolve('connected'));
			socket.once('connect_error', () => resolve('refused'));
		});
	}

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const email = `int-${randomUUID()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: PASSWORD,
			email_confirm: true,
		});
		if (error) throw error;
		userId = data.user.id;
		const { error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.insert({ id: userId, username: `int_${userId.slice(0, 8)}` });
		if (profileError) throw profileError;
		const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
			email,
			password: PASSWORD,
		});
		if (signInError) throw signInError;
		token = session.session.access_token;

		httpServer = createServer();
		socketServer.initialize(httpServer);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
	});

	afterEach(() => {
		while (clients.length) clients.pop()?.disconnect();
	});

	afterAll(async () => {
		await getIO()?.close();
		if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
		await disconnectRedis();
	});

	it.each(['websocket', 'polling'] as const)(
		'refuses a %s connection from an origin outside ALLOWED_ORIGINS',
		async transport => {
			await expect(outcome(connect(transport, 'http://evil.example'))).resolves.toBe('refused');
		}
	);

	it.each(['websocket', 'polling'] as const)(
		'accepts a %s connection from an allowed origin',
		async transport => {
			await expect(outcome(connect(transport, 'http://allowed.example'))).resolves.toBe(
				'connected'
			);
		}
	);

	it('accepts a connection without Origin header', async () => {
		await expect(outcome(connect('websocket'))).resolves.toBe('connected');
	});

	it("accepts the Android app's WebSocket, whose Origin is the backend's own address", async () => {
		await expect(outcome(connect('websocket', url))).resolves.toBe('connected');
	});
});
