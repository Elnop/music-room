import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { logger } from '@/shared/utils/logger.js';
import {
	createSupabaseAuthProxy,
	mountSupabaseAuthProxy,
} from '@/shared/dev/supabase-auth-proxy.js';

// The dev tunnel's proxy to the local Supabase stack (#251), against a fake
// upstream HTTP server on an ephemeral port.

interface Received {
	method: string;
	url: string;
	headers: IncomingHttpHeaders;
	body: string;
}

function listen(server: Server): Promise<string> {
	return new Promise(resolve =>
		server.listen(0, '127.0.0.1', () =>
			resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
		)
	);
}

function close(server: Server): Promise<void> {
	return new Promise(resolve => server.close(() => resolve()));
}

/** App wired like server.ts: the proxy, then a body parser, then a 404. */
function proxyApp(upstreamUrl: string, timeoutMs?: number): Server {
	const app = express();
	app.use('/supabase', createSupabaseAuthProxy(upstreamUrl, timeoutMs));
	app.use(express.json());
	app.use((_req, res) => {
		res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
	});
	return createServer(app);
}

describe('createSupabaseAuthProxy', () => {
	const received: Received[] = [];
	let upstream: Server;
	let upstreamUrl: string;
	let proxy: Server;
	let proxyUrl: string;

	beforeAll(async () => {
		upstream = createServer((req, res) => {
			const chunks: Buffer[] = [];
			req.on('data', (chunk: Buffer) => chunks.push(chunk));
			req.on('end', () => {
				received.push({
					method: req.method ?? '',
					url: req.url ?? '',
					headers: req.headers,
					body: Buffer.concat(chunks).toString(),
				});
				res.writeHead(201, { 'content-type': 'application/json', 'x-upstream': 'yes' });
				res.end(JSON.stringify({ access_token: 'token-from-upstream' }));
			});
		});
		upstreamUrl = await listen(upstream);
		proxy = proxyApp(upstreamUrl);
		proxyUrl = await listen(proxy);
	});

	afterEach(() => {
		received.length = 0;
	});

	afterAll(async () => {
		await close(proxy);
		await close(upstream);
	});

	it('forwards an auth call with its method, path, query, headers and body', async () => {
		const body = JSON.stringify({ email: 'a@example.com', password: 'secret' });
		const response = await fetch(`${proxyUrl}/supabase/auth/v1/token?grant_type=password`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', apikey: 'anon-key' },
			body,
		});

		expect(response.status).toBe(201);
		expect(response.headers.get('x-upstream')).toBe('yes');
		await expect(response.json()).resolves.toEqual({ access_token: 'token-from-upstream' });

		expect(received).toHaveLength(1);
		const [call] = received;
		expect(call.method).toBe('POST');
		expect(call.url).toBe('/auth/v1/token?grant_type=password');
		expect(call.headers.apikey).toBe('anon-key');
		expect(call.headers['content-type']).toBe('application/json');
		expect(call.headers.host).toBe(new URL(upstreamUrl).host);
		expect(call.body).toBe(body);
	});

	it('answers 404 outside /auth/v1 without forwarding', async () => {
		const response = await fetch(`${proxyUrl}/supabase/rest/v1/profiles`);

		expect(response.status).toBe(404);
		expect(received).toHaveLength(0);
	});

	it('does not let dot segments escape /auth/v1', async () => {
		const response = await fetch(`${proxyUrl}/supabase/auth/v1/%2e%2e/%2e%2e/rest/v1/profiles`);

		expect(response.status).toBe(404);
		expect(received).toHaveLength(0);
	});

	it('answers 502 SUPABASE_UNREACHABLE when the stack is down', async () => {
		const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
		const dead = createServer();
		const deadUrl = await listen(dead);
		await close(dead);
		const server = proxyApp(deadUrl);
		const url = await listen(server);

		try {
			const response = await fetch(`${url}/supabase/auth/v1/health`);

			expect(response.status).toBe(502);
			await expect(response.json()).resolves.toMatchObject({
				success: false,
				error: { code: 'SUPABASE_UNREACHABLE' },
			});
			expect(warn).toHaveBeenCalledOnce();
		} finally {
			await close(server);
		}
	});

	it('answers 502 when the stack does not answer in time', async () => {
		const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
		const hung = createServer(() => undefined);
		const hungUrl = await listen(hung);
		const server = proxyApp(hungUrl, 50);
		const url = await listen(server);

		try {
			const response = await fetch(`${url}/supabase/auth/v1/health`);

			expect(response.status).toBe(502);
			await expect(response.json()).resolves.toMatchObject({
				error: { code: 'SUPABASE_UNREACHABLE' },
			});
			expect(warn).toHaveBeenCalledOnce();
		} finally {
			hung.closeAllConnections();
			await close(server);
			await close(hung);
		}
	});

	it('ends the client response when the upstream cuts it mid-body', async () => {
		const cut = createServer((_req, res) => {
			res.writeHead(200, { 'content-length': '100' });
			res.write('partial');
			setTimeout(() => res.socket?.destroy(), 20);
		});
		const cutUrl = await listen(cut);
		const server = proxyApp(cutUrl);
		const url = await listen(server);

		try {
			const response = await fetch(`${url}/supabase/auth/v1/health`);
			expect(response.status).toBe(200);
			await expect(response.text()).rejects.toThrow();
		} finally {
			await close(server);
			await close(cut);
		}
	});

	it.each([
		{ TUNNEL_MODE: false, NODE_ENV: 'development', SUPABASE_MODE: 'local' as const },
		{ TUNNEL_MODE: true, NODE_ENV: 'production', SUPABASE_MODE: 'local' as const },
		{ TUNNEL_MODE: true, NODE_ENV: 'test', SUPABASE_MODE: 'local' as const },
		{ TUNNEL_MODE: true, NODE_ENV: 'development', SUPABASE_MODE: 'hosted' as const },
		{ TUNNEL_MODE: true, NODE_ENV: 'development', SUPABASE_MODE: undefined },
	])('is not mounted with %o: /supabase falls through to the 404', async settings => {
		const app = express();
		expect(mountSupabaseAuthProxy(app, { ...settings, SUPABASE_URL: upstreamUrl })).toBe(false);
		app.use((_req, res) => {
			res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
		});
		const server = createServer(app);
		const url = await listen(server);

		try {
			const response = await fetch(`${url}/supabase/auth/v1/health`);
			expect(response.status).toBe(404);
			expect(received).toHaveLength(0);
		} finally {
			await close(server);
		}
	});

	it('is mounted in tunnel mode during development with the local stack', async () => {
		const app = express();
		expect(
			mountSupabaseAuthProxy(app, {
				TUNNEL_MODE: true,
				NODE_ENV: 'development',
				SUPABASE_MODE: 'local',
				SUPABASE_URL: upstreamUrl,
			})
		).toBe(true);
		const server = createServer(app);
		const url = await listen(server);

		try {
			const response = await fetch(`${url}/supabase/auth/v1/health`);
			expect(response.status).toBe(201);
			expect(received.map(call => call.url)).toEqual(['/auth/v1/health']);
		} finally {
			await close(server);
		}
	});
});
