import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express, { type NextFunction, type Request, type Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import profileRoutes from '@/features/profile/profile.routes.js';
import { errorHandler } from '@/shared/middleware/error-handler.js';
import { MUSIC_GENRES } from '@/features/profile/profile.types.js';

/**
 * Route-level tests for /api/profile. The real controller, validators and
 * services run; only the Supabase client, the auth middleware and the logger
 * are mocked. The fake client answers per table and operation, and records
 * every builder call so a test can check what was queried.
 */

type Op = 'select' | 'update' | 'insert';
interface FakeResult {
	data: unknown;
	error: { code?: string; message: string } | null;
}
interface QueryCall {
	table: string;
	op: Op;
	method: string;
	args: unknown[];
}

const db = vi.hoisted(() => {
	const results = new Map<string, FakeResult>();
	const calls: QueryCall[] = [];

	class FakeQuery implements PromiseLike<FakeResult> {
		private op: Op = 'select';

		constructor(private readonly table: string) {}

		private record(method: string, args: unknown[]) {
			calls.push({ table: this.table, op: this.op, method, args });
			return this;
		}

		private result(): FakeResult {
			return (
				results.get(`${this.table}.${this.op}`) ?? {
					data: null,
					error: { code: 'PGRST116', message: 'No rows found' },
				}
			);
		}

		select(...args: unknown[]) {
			return this.record('select', args);
		}
		eq(...args: unknown[]) {
			return this.record('eq', args);
		}
		neq(...args: unknown[]) {
			return this.record('neq', args);
		}
		in(...args: unknown[]) {
			return this.record('in', args);
		}
		or(...args: unknown[]) {
			return this.record('or', args);
		}
		limit(...args: unknown[]) {
			return this.record('limit', args);
		}
		update(...args: unknown[]) {
			this.op = 'update';
			return this.record('update', args);
		}
		insert(...args: unknown[]) {
			this.op = 'insert';
			return this.record('insert', args);
		}
		single() {
			return Promise.resolve(this.result());
		}
		then<T1 = FakeResult, T2 = never>(
			onFulfilled?: ((value: FakeResult) => T1 | PromiseLike<T1>) | null,
			onRejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
		): PromiseLike<T1 | T2> {
			return Promise.resolve(this.result()).then(onFulfilled, onRejected);
		}
	}

	const from = vi.fn((table: string) => new FakeQuery(table));
	const getUserById = vi.fn();

	return { results, calls, from, getUserById };
});

vi.mock('@/shared/config/supabase.js', () => {
	const client = { from: db.from, auth: { admin: { getUserById: db.getUserById } } };
	return { supabase: client, supabaseAdmin: client };
});

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const TEST_USER_HEADER = 'x-test-user';

vi.mock('@/features/auth/auth.middleware.js', () => ({
	authMiddleware: (req: Request, res: Response, next: NextFunction) => {
		const id = req.header('x-test-user');
		if (!id) {
			res.status(401).json({ success: false, error: { code: 'NO_AUTH_HEADER' } });
			return;
		}
		(req as Request & { user: { id: string; email: string } }).user = {
			id,
			email: `${id}@zumik.test`,
		};
		next();
	},
}));

// =====================================================
// Fixtures and helpers
// =====================================================

const ALICE = 'user-a';
const BOB = 'user-b';

type Visibility = 'public' | 'friends_only' | 'private';

function profileRow(id = ALICE) {
	return {
		id,
		username: 'alice',
		display_name: 'Alice',
		avatar_url: 'https://cdn.zumik.test/alice.png',
		bio: 'Hello there',
		favorite_artist: 'Daft Punk',
		created_at: '2026-01-01T00:00:00.000Z',
		updated_at: '2026-01-02T00:00:00.000Z',
	};
}

function privacyRow(
	userId: string,
	visibility: Partial<{
		email_visibility: Visibility;
		bio_visibility: Visibility;
		avatar_visibility: Visibility;
		music_preferences_visibility: Visibility;
	}> = {}
) {
	return {
		user_id: userId,
		email_visibility: 'public',
		bio_visibility: 'public',
		avatar_visibility: 'public',
		music_preferences_visibility: 'public',
		created_at: '2026-01-01T00:00:00.000Z',
		updated_at: '2026-01-01T00:00:00.000Z',
		...visibility,
	};
}

function allVisibility(level: Visibility) {
	return {
		email_visibility: level,
		bio_visibility: level,
		avatar_visibility: level,
		music_preferences_visibility: level,
	};
}

function setResult(table: string, op: Op, data: unknown, error: FakeResult['error'] = null) {
	db.results.set(`${table}.${op}`, { data, error });
}

const follow = (follower: string, following: string) => ({
	follower_id: follower,
	following_id: following,
});
const ONE_WAY = [follow(BOB, ALICE)];
const ONE_WAY_BACK = [follow(ALICE, BOB)];
const MUTUAL = [follow(BOB, ALICE), follow(ALICE, BOB)];

/** Alice's profile seen by Bob, with the given privacy row and follows. */
function arrangeThirdParty(privacy: ReturnType<typeof privacyRow>, follows: unknown[] = []) {
	setResult('user_profiles', 'select', profileRow(ALICE));
	setResult('profile_privacy', 'select', privacy);
	setResult('follows', 'select', follows);
	setResult('music_preferences', 'select', { genres: ['rock', 'jazz'] });
}

function callsOn(table: string, method?: string) {
	return db.calls.filter(c => c.table === table && (!method || c.method === method));
}

interface ApiBody {
	success: boolean;
	data: Record<string, unknown> & { genres?: unknown };
	error?: { code?: string };
}

let server: Server;
let baseUrl: string;

async function api(
	method: string,
	path: string,
	{ user, body }: { user?: string; body?: unknown } = {}
): Promise<{ status: number; body: ApiBody }> {
	const headers: Record<string, string> = { 'content-type': 'application/json' };
	if (user) headers[TEST_USER_HEADER] = user;
	const res = await fetch(`${baseUrl}/api/profile${path}`, {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	return { status: res.status, body: (await res.json()) as ApiBody };
}

beforeAll(async () => {
	const app = express();
	app.use(express.json());
	app.use('/api/profile', profileRoutes);
	app.use(errorHandler);
	server = app.listen(0, '127.0.0.1');
	await new Promise<void>(resolve => server.once('listening', () => resolve()));
	baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close(err => (err ? reject(err) : resolve()))
	);
});

beforeEach(() => {
	db.results.clear();
	db.calls.length = 0;
	db.from.mockClear();
	db.getUserById
		.mockReset()
		.mockImplementation((id: string) =>
			Promise.resolve({ data: { user: { id, email: `${id}@zumik.test` } }, error: null })
		);
});

// =====================================================
// Authentication
// =====================================================

describe('authentication', () => {
	it.each([
		['GET', '/'],
		['PATCH', '/'],
		['GET', '/search?q=ali'],
		['GET', '/privacy'],
		['PUT', '/privacy'],
		['GET', '/music-preferences'],
		['PUT', '/music-preferences'],
		['GET', '/music-preferences/genres'],
		['GET', `/${ALICE}`],
	])('%s %s answers 401 without a user and never reaches Supabase', async (method, path) => {
		const res = await api(method, path, { body: method === 'GET' ? undefined : {} });

		expect(res.status).toBe(401);
		expect(db.from).not.toHaveBeenCalled();
	});
});

// =====================================================
// GET /api/profile/:userId (privacy filtering)
// =====================================================

describe('GET /api/profile/:userId', () => {
	it('shows every public field to a third party who is not a friend', async () => {
		arrangeThirdParty(privacyRow(ALICE));

		const res = await api('GET', `/${ALICE}`, { user: BOB });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({
			id: ALICE,
			username: 'alice',
			bio: 'Hello there',
			avatarUrl: 'https://cdn.zumik.test/alice.png',
			musicPreferences: ['rock', 'jazz'],
			email: `${ALICE}@zumik.test`,
			isFriend: false,
			isOwnProfile: false,
		});
	});

	describe.each([
		['no follow', []],
		['a one-way follow (viewer follows target)', ONE_WAY],
		['a one-way follow (target follows viewer)', ONE_WAY_BACK],
	])('friends_only field, viewer with %s', (_label, follows) => {
		it.each([
			['bio', 'bio_visibility'],
			['avatarUrl', 'avatar_visibility'],
			['musicPreferences', 'music_preferences_visibility'],
			['email', 'email_visibility'],
		] as const)('hides %s', async (field, column) => {
			arrangeThirdParty(privacyRow(ALICE, { [column]: 'friends_only' }), follows);

			const res = await api('GET', `/${ALICE}`, { user: BOB });

			expect(res.status).toBe(200);
			expect(res.body.data.isFriend).toBe(false);
			expect(res.body.data).not.toHaveProperty(field);
			if (field === 'email') expect(db.getUserById).not.toHaveBeenCalled();
		});
	});

	it('hides all friends_only fields from a one-way follower', async () => {
		arrangeThirdParty(privacyRow(ALICE, allVisibility('friends_only')), ONE_WAY);

		const res = await api('GET', `/${ALICE}`, { user: BOB });

		expect(res.status).toBe(200);
		expect(res.body.data.isFriend).toBe(false);
		for (const field of ['bio', 'avatarUrl', 'musicPreferences', 'email']) {
			expect(res.body.data).not.toHaveProperty(field);
		}
	});

	it('shows friends_only fields to a mutual friend and queries both follow directions', async () => {
		arrangeThirdParty(privacyRow(ALICE, allVisibility('friends_only')), MUTUAL);

		const res = await api('GET', `/${ALICE}`, { user: BOB });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({
			bio: 'Hello there',
			avatarUrl: 'https://cdn.zumik.test/alice.png',
			musicPreferences: ['rock', 'jazz'],
			email: `${ALICE}@zumik.test`,
			isFriend: true,
		});
		const inArgs = callsOn('follows', 'in').map(c => c.args);
		expect(inArgs).toContainEqual(['follower_id', [BOB, ALICE]]);
		expect(inArgs).toContainEqual(['following_id', [BOB, ALICE]]);
	});

	it('hides private fields from a mutual friend and never reads the email', async () => {
		arrangeThirdParty(privacyRow(ALICE, allVisibility('private')), MUTUAL);

		const res = await api('GET', `/${ALICE}`, { user: BOB });

		expect(res.status).toBe(200);
		expect(res.body.data.isFriend).toBe(true);
		for (const field of ['bio', 'avatarUrl', 'musicPreferences', 'email']) {
			expect(res.body.data).not.toHaveProperty(field);
		}
		expect(db.getUserById).not.toHaveBeenCalled();
	});

	it('shows every field on the own profile, even when all are private', async () => {
		setResult('user_profiles', 'select', profileRow(ALICE));
		setResult('profile_privacy', 'select', privacyRow(ALICE, allVisibility('private')));
		setResult('music_preferences', 'select', { genres: ['pop'] });

		const res = await api('GET', `/${ALICE}`, { user: ALICE });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({
			bio: 'Hello there',
			avatarUrl: 'https://cdn.zumik.test/alice.png',
			musicPreferences: ['pop'],
			email: `${ALICE}@zumik.test`,
			isOwnProfile: true,
			isFriend: false,
		});
		expect(callsOn('follows')).toHaveLength(0);
	});

	it('creates the default privacy row when the owner opens a profile without one', async () => {
		setResult('user_profiles', 'select', profileRow(ALICE));
		setResult('profile_privacy', 'select', null, { code: 'PGRST116', message: 'No rows found' });
		setResult('profile_privacy', 'insert', privacyRow(ALICE));
		setResult('music_preferences', 'select', { genres: [] });

		const res = await api('GET', `/${ALICE}`, { user: ALICE });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({ isOwnProfile: true });
		const inserts = callsOn('profile_privacy', 'insert');
		expect(inserts).toHaveLength(1);
		expect(inserts[0].args[0]).toMatchObject({ user_id: ALICE });
	});

	it('answers 404 PROFILE_NOT_FOUND for an unknown user', async () => {
		setResult('user_profiles', 'select', null, { code: 'PGRST116', message: 'No rows found' });

		const res = await api('GET', '/user-unknown', { user: BOB });

		expect(res.status).toBe(404);
		expect(res.body.error?.code).toBe('PROFILE_NOT_FOUND');
	});

	it('applies the defaults when the target has no privacy row, without inserting one', async () => {
		setResult('user_profiles', 'select', profileRow(ALICE));
		setResult('profile_privacy', 'select', null, { code: 'PGRST116', message: 'No rows found' });
		setResult('follows', 'select', []);
		setResult('music_preferences', 'select', { genres: ['metal'] });

		const res = await api('GET', `/${ALICE}`, { user: BOB });

		expect(res.status).toBe(200);
		expect(res.body.data).not.toHaveProperty('email');
		expect(res.body.data).toMatchObject({
			bio: 'Hello there',
			avatarUrl: 'https://cdn.zumik.test/alice.png',
			musicPreferences: ['metal'],
		});
		expect(callsOn('profile_privacy', 'insert')).toHaveLength(0);
		expect(db.getUserById).not.toHaveBeenCalled();
	});
});

// =====================================================
// Own profile
// =====================================================

describe('GET /api/profile', () => {
	it('returns the own profile with the auth email', async () => {
		setResult('user_profiles', 'select', profileRow(ALICE));

		const res = await api('GET', '/', { user: ALICE });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({
			id: ALICE,
			email: `${ALICE}@zumik.test`,
			username: 'alice',
			displayName: 'Alice',
			bio: 'Hello there',
			favoriteArtist: 'Daft Punk',
		});
		expect(callsOn('user_profiles', 'eq')[0]?.args).toEqual(['id', ALICE]);
		expect(db.getUserById).toHaveBeenCalledWith(ALICE);
	});
});

describe('PATCH /api/profile', () => {
	it('writes snake_case fields to user_profiles for the requester', async () => {
		setResult('user_profiles', 'update', {
			...profileRow(ALICE),
			display_name: 'Ally',
			bio: 'New bio',
		});

		const res = await api('PATCH', '/', {
			user: ALICE,
			body: { displayName: 'Ally', bio: 'New bio', avatarUrl: 'https://cdn.zumik.test/new.png' },
		});

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({ displayName: 'Ally', bio: 'New bio' });
		const [update] = callsOn('user_profiles', 'update');
		expect(update?.args[0]).toMatchObject({
			display_name: 'Ally',
			bio: 'New bio',
			avatar_url: 'https://cdn.zumik.test/new.png',
			updated_at: expect.any(String) as unknown,
		});
		expect(callsOn('user_profiles', 'eq').map(c => c.args)).toContainEqual(['id', ALICE]);
	});
});

// =====================================================
// Search
// =====================================================

describe('GET /api/profile/search', () => {
	it('excludes the requester, passes the limit and maps the rows', async () => {
		setResult('user_profiles', 'select', [profileRow(ALICE)]);

		const res = await api('GET', '/search?q=ali&limit=5', { user: BOB });

		expect(res.status).toBe(200);
		expect(res.body.data).toEqual([
			expect.objectContaining({ id: ALICE, username: 'alice', displayName: 'Alice' }),
		]);
		expect(callsOn('user_profiles', 'neq')[0]?.args).toEqual(['id', BOB]);
		expect(callsOn('user_profiles', 'limit')[0]?.args).toEqual([5]);
		expect(callsOn('user_profiles', 'or')).toHaveLength(1);
	});

	it('defaults the limit to 20', async () => {
		setResult('user_profiles', 'select', []);

		const res = await api('GET', '/search?q=ali', { user: BOB });

		expect(res.status).toBe(200);
		expect(callsOn('user_profiles', 'limit')[0]?.args).toEqual([20]);
	});
});

// =====================================================
// Privacy settings
// =====================================================

describe('GET /api/profile/privacy', () => {
	it('returns the stored settings in camelCase', async () => {
		setResult(
			'profile_privacy',
			'select',
			privacyRow(ALICE, { bio_visibility: 'friends_only', email_visibility: 'private' })
		);

		const res = await api('GET', '/privacy', { user: ALICE });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({
			userId: ALICE,
			emailVisibility: 'private',
			bioVisibility: 'friends_only',
			avatarVisibility: 'public',
			musicPreferencesVisibility: 'public',
		});
		expect(callsOn('profile_privacy', 'eq')[0]?.args).toEqual(['user_id', ALICE]);
	});

	// The controller calls getPrivacySettings(userId) without a requesterId, so a
	// missing row is answered with the defaults and nothing is inserted (the
	// insert branch is only reached from PUT).
	it('answers the default settings when the requester has no row', async () => {
		setResult('profile_privacy', 'select', null, { code: 'PGRST116', message: 'No rows found' });

		const res = await api('GET', '/privacy', { user: ALICE });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({
			userId: ALICE,
			emailVisibility: 'private',
			bioVisibility: 'public',
			avatarVisibility: 'public',
			musicPreferencesVisibility: 'public',
		});
	});
});

describe('PUT /api/profile/privacy', () => {
	it('writes the provided levels in snake_case', async () => {
		setResult(
			'profile_privacy',
			'update',
			privacyRow(ALICE, { bio_visibility: 'friends_only', avatar_visibility: 'private' })
		);

		const res = await api('PUT', '/privacy', {
			user: ALICE,
			body: { bioVisibility: 'friends_only', avatarVisibility: 'private' },
		});

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({
			bioVisibility: 'friends_only',
			avatarVisibility: 'private',
		});
		const [update] = callsOn('profile_privacy', 'update');
		expect(update?.args[0]).toEqual({
			bio_visibility: 'friends_only',
			avatar_visibility: 'private',
			updated_at: expect.any(String) as unknown,
		});
		expect(callsOn('profile_privacy', 'eq')[0]?.args).toEqual(['user_id', ALICE]);
	});

	it('inserts a row with the provided levels over the defaults when none exists', async () => {
		setResult('profile_privacy', 'update', null, { code: 'PGRST116', message: 'No rows found' });
		setResult('profile_privacy', 'insert', privacyRow(ALICE, { email_visibility: 'friends_only' }));

		const res = await api('PUT', '/privacy', {
			user: ALICE,
			body: { emailVisibility: 'friends_only' },
		});

		expect(res.status).toBe(200);
		const [insert] = callsOn('profile_privacy', 'insert');
		expect(insert?.args[0]).toEqual({
			user_id: ALICE,
			email_visibility: 'friends_only',
			bio_visibility: 'public',
			avatar_visibility: 'public',
			music_preferences_visibility: 'public',
		});
	});
});

// =====================================================
// Music preferences
// =====================================================

describe('music preferences', () => {
	it('GET returns the stored genres', async () => {
		setResult('music_preferences', 'select', {
			user_id: ALICE,
			genres: ['rock', 'jazz'],
			updated_at: '2026-01-01T00:00:00.000Z',
		});

		const res = await api('GET', '/music-preferences', { user: ALICE });

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({ userId: ALICE, genres: ['rock', 'jazz'] });
	});

	it('PUT writes the genres for the requester', async () => {
		setResult('music_preferences', 'update', {
			user_id: ALICE,
			genres: ['pop', 'metal'],
			updated_at: '2026-01-03T00:00:00.000Z',
		});

		const res = await api('PUT', '/music-preferences', {
			user: ALICE,
			body: { genres: ['pop', 'metal'] },
		});

		expect(res.status).toBe(200);
		expect(res.body.data).toMatchObject({ genres: ['pop', 'metal'] });
		const [update] = callsOn('music_preferences', 'update');
		expect(update?.args[0]).toMatchObject({ genres: ['pop', 'metal'] });
		expect(callsOn('music_preferences', 'eq')[0]?.args).toEqual(['user_id', ALICE]);
	});

	it('GET /genres lists every available genre without touching Supabase', async () => {
		const res = await api('GET', '/music-preferences/genres', { user: ALICE });

		expect(res.status).toBe(200);
		expect(res.body.data.genres).toEqual([...MUSIC_GENRES]);
		expect(db.from).not.toHaveBeenCalled();
	});
});

// =====================================================
// Validation
// =====================================================

describe('validation', () => {
	it.each([
		['PATCH', '/', { displayName: '   ' }],
		['PATCH', '/', { displayName: 'a'.repeat(16) }],
		['PUT', '/privacy', { bioVisibility: 'friends' }],
		['PUT', '/music-preferences', { genres: ['pop', 'rock', 'jazz', 'rnb', 'metal', 'latin'] }],
		['PUT', '/music-preferences', { genres: ['pop', 'pop'] }],
		['GET', '/search', undefined],
	])('%s %s with %j answers 400 VALIDATION_ERROR before any query', async (method, path, body) => {
		const res = await api(method, path, { user: ALICE, body });

		expect(res.status).toBe(400);
		expect(res.body.error?.code).toBe('VALIDATION_ERROR');
		expect(db.from).not.toHaveBeenCalled();
	});
});
