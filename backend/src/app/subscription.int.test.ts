import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import { errorHandler } from '@/shared/middleware/error-handler.js';
import { assertPremium } from '@/shared/subscription/plan.js';
import type { Subscription } from '@/features/subscription/subscription.types.js';

const { routes } = await import('@/app/routes.js');

// The router as app/routes.ts mounts it (with authMiddleware), against the local stack.
const mounted = routes.find(route => route.path === '/api/subscription')!;

const PASSWORD = 'integration-test-password';

interface ApiBody {
	success: boolean;
	data?: Subscription;
	error?: { code?: string };
}

async function createUser(): Promise<{ id: string; token: string }> {
	const email = `int-subscription-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: data.user.id, username: `ints_${data.user.id.slice(0, 8)}` });
	if (profileError) throw profileError;
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	return { id: data.user.id, token: session.session.access_token };
}

describe('Subscription routes: /api/subscription', () => {
	let httpServer: HTTPServer;
	let baseUrl: string;
	let user: { id: string; token: string };

	async function call(
		method: 'GET' | 'PUT',
		body?: object,
		token: string | null = user.token
	): Promise<{ status: number; body: ApiBody }> {
		const res = await fetch(`${baseUrl}/api/subscription`, {
			method,
			headers: {
				...(token && { Authorization: `Bearer ${token}` }),
				'Content-Type': 'application/json',
			},
			body: body && JSON.stringify(body),
		});
		return { status: res.status, body: (await res.json()) as ApiBody };
	}

	beforeAll(async () => {
		// verifyToken checks the logout denylist and fails closed without Redis.
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		app.use(express.json());
		app.use(mounted.path, mounted.router);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, resolve));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

		user = await createUser();
	});

	afterAll(async () => {
		await new Promise<void>(resolve => httpServer.close(() => resolve()));
		await disconnectRedis();
		if (user) await supabaseAdmin.auth.admin.deleteUser(user.id); // cascades
	});

	it('puts a new account on the free plan', async () => {
		const { status, body } = await call('GET');

		expect(status).toBe(200);
		expect(body.data).toEqual({ plan: 'free', premiumFeatures: ['playlist_cover'] });
		await expect(assertPremium(user.id)).rejects.toMatchObject({ code: 'PREMIUM_REQUIRED' });
	});

	it('switches to premium and back, visible on the next GET', async () => {
		const upgraded = await call('PUT', { plan: 'premium' });
		expect(upgraded.status).toBe(200);
		expect(upgraded.body.data?.plan).toBe('premium');
		expect((await call('GET')).body.data?.plan).toBe('premium');
		await expect(assertPremium(user.id)).resolves.toBeUndefined();

		const { data: row } = await supabaseAdmin
			.from('user_profiles')
			.select('plan_changed_at')
			.eq('id', user.id)
			.single();
		expect(row?.plan_changed_at).not.toBeNull();

		const downgraded = await call('PUT', { plan: 'free' });
		expect(downgraded.status).toBe(200);
		expect((await call('GET')).body.data?.plan).toBe('free');
	});

	it('answers 400 for an unknown plan', async () => {
		const { status, body } = await call('PUT', { plan: 'gold' });

		expect(status).toBe(400);
		expect(body.error?.code).toBe('VALIDATION_ERROR');
	});

	it('answers 401 without a token', async () => {
		expect((await call('GET', undefined, null)).status).toBe(401);
		expect((await call('PUT', { plan: 'premium' }, null)).status).toBe(401);
	});
});
