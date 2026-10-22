import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from '@/features/auth/services/login.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { from, selectSingle, signInWithPassword, findAuthUserIdByEmail } = vi.hoisted(() => ({
	from: vi.fn(),
	selectSingle:
		vi.fn<(table: string, columns: string, col: string, value: unknown) => Promise<unknown>>(),
	signInWithPassword: vi.fn(),
	findAuthUserIdByEmail: vi.fn(),
}));

vi.mock('@/shared/config/supabase.js', () => ({
	supabaseAdmin: { from },
	createSignInClient: () => ({ auth: { signInWithPassword } }),
}));

vi.mock('@/features/auth/utils/find-auth-user.js', () => ({ findAuthUserIdByEmail }));

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

async function caught(promise: Promise<unknown>): Promise<unknown> {
	return promise.then(
		() => {
			throw new Error('expected a rejection');
		},
		(error: unknown) => error
	);
}

/** supabase.from(table).select(cols).eq(col, value).single() resolves through selectSingle. */
function builder(table: string) {
	let columns = '';
	const query = {
		select: (cols: string) => {
			columns = cols;
			return query;
		},
		eq: (col: string, value: unknown) => ({
			single: () => selectSingle(table, columns, col, value),
		}),
	};
	return query;
}

const NOT_FOUND = { data: null, error: { code: 'PGRST116', message: 'no rows' } };

const credentials = { email: 'user@example.com', password: 'Password1' };
const authUser = { id: 'user-1', email: credentials.email };
const authSession = {
	access_token: 'access-token',
	refresh_token: 'refresh-token',
	expires_in: 3600,
	expires_at: 1_700_000_000,
};

describe('login.service', () => {
	beforeEach(() => {
		from.mockReset().mockImplementation(builder);
		selectSingle.mockReset().mockResolvedValue(NOT_FOUND);
		signInWithPassword.mockReset();
		findAuthUserIdByEmail.mockReset().mockResolvedValue(null);
	});

	const signedIn = () =>
		signInWithPassword.mockResolvedValue({
			data: { user: authUser, session: authSession },
			error: null,
		});
	const withProfile = (profile: Record<string, unknown>) =>
		selectSingle.mockResolvedValue({
			data: {
				username: 'user',
				display_name: null,
				avatar_url: null,
				bio: null,
				created_at: null,
				updated_at: null,
				google_id: null,
				facebook_id: null,
				...profile,
			},
			error: null,
		});

	it('answers 403 EMAIL_NOT_VERIFIED with the user id and email for an unverified account', async () => {
		signedIn();
		withProfile({ email_verified: false });

		const error = await caught(service.login(credentials));

		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({
			statusCode: 403,
			code: 'EMAIL_NOT_VERIFIED',
			details: { userId: authUser.id, email: authUser.email },
		});
	});

	it('signs in an unverified account linked to Google', async () => {
		signedIn();
		withProfile({ email_verified: false, google_id: 'google-123' });

		const result = await service.login(credentials);

		expect(result.session?.accessToken).toBe('access-token');
	});

	it('returns the user and a session for a verified account', async () => {
		signedIn();
		withProfile({ email_verified: true });

		const result = await service.login(credentials);

		expect(result.user).toMatchObject({
			id: authUser.id,
			email: authUser.email,
			username: 'user',
		});
		expect(result.session).toMatchObject({
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
		});
		expect(selectSingle).toHaveBeenCalledWith(
			'user_profiles',
			expect.any(String),
			'id',
			authUser.id
		);
	});

	it('answers 401 INVALID_CREDENTIALS when Supabase refuses the password', async () => {
		signInWithPassword.mockResolvedValue({
			data: { user: null, session: null },
			error: { message: 'Invalid login credentials' },
		});

		const error = await caught(service.login(credentials));

		expect(error).toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
		expect(from).not.toHaveBeenCalled();
	});

	it('answers 403 EMAIL_NOT_VERIFIED when Supabase reports the email unconfirmed (#243)', async () => {
		signInWithPassword.mockResolvedValue({
			data: { user: null, session: null },
			error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
		});
		findAuthUserIdByEmail.mockResolvedValue('unconfirmed-id');

		const error = await caught(service.login(credentials));

		expect(error).toMatchObject({
			statusCode: 403,
			code: 'EMAIL_NOT_VERIFIED',
			details: { userId: 'unconfirmed-id', email: credentials.email },
		});
		expect(from).not.toHaveBeenCalled();
	});

	it('answers 404 PROFILE_NOT_FOUND when the profile cannot be read', async () => {
		signedIn();
		selectSingle.mockResolvedValue(NOT_FOUND);

		const error = await caught(service.login(credentials));

		expect(error).toMatchObject({ statusCode: 404, code: 'PROFILE_NOT_FOUND' });
	});
});
