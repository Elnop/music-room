import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@/features/auth/auth.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const {
	from,
	selectSingle,
	profileDelete,
	profileInsert,
	createUser,
	deleteUser,
	signInWithPassword,
	findAuthUserIdByEmail,
	generateAndStore,
	sendVerificationEmail,
	verification,
} = vi.hoisted(() => ({
	verification: { enabled: true },
	from: vi.fn(),
	selectSingle:
		vi.fn<(table: string, columns: string, col: string, value: unknown) => Promise<unknown>>(),
	profileDelete: vi.fn<(table: string, col: string, value: unknown) => Promise<unknown>>(),
	profileInsert: vi.fn<(table: string, row: unknown) => Promise<unknown>>(),
	createUser: vi.fn(),
	deleteUser: vi.fn(),
	signInWithPassword: vi.fn(),
	findAuthUserIdByEmail: vi.fn(),
	generateAndStore: vi.fn(),
	sendVerificationEmail: vi.fn(),
}));

vi.mock('@/shared/config/supabase.js', () => ({
	supabase: { from, auth: { admin: { createUser, deleteUser } } },
	supabaseAdmin: { from, auth: { admin: { createUser, deleteUser } } },
	createSignInClient: () => ({ auth: { signInWithPassword } }),
}));

vi.mock('@/features/auth/utils/find-auth-user.js', () => ({ findAuthUserIdByEmail }));

vi.mock('@/features/auth/services/email-verification.service.js', () => ({
	EmailVerificationService: class {
		generateAndStore = generateAndStore;
		sendVerificationEmail = sendVerificationEmail;
	},
}));

// EMAIL_VERIFICATION_ENABLED, switched per test (#253)
vi.mock('@/features/mail/mail.config.js', async importOriginal => {
	const original = await importOriginal<typeof import('@/features/mail/mail.config.js')>();
	return {
		...original,
		verificationConfig: Object.assign(verification, {
			...original.verificationConfig,
			enabled: true,
		}),
	};
});

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

/**
 * Query builder for one supabase.from(table) call: select(cols).eq(col, value).single()
 * resolves through selectSingle(table, cols, col, value); delete().eq(col, value)
 * through profileDelete(table, col, value); insert(row) through profileInsert(table, row).
 */
function builder(table: string) {
	let columns = '';
	let deleting = false;
	const query = {
		select: (cols: string) => {
			columns = cols;
			return query;
		},
		delete: () => {
			deleting = true;
			return query;
		},
		insert: (row: unknown) => profileInsert(table, row),
		eq: (col: string, value: unknown) => {
			if (deleting) return profileDelete(table, col, value);
			return { single: () => selectSingle(table, columns, col, value) };
		},
	};
	return query;
}

const NOT_FOUND = { data: null, error: { code: 'PGRST116', message: 'no rows' } };

const registration = {
	email: 'new@example.com',
	password: 'Password1',
	username: 'newuser',
	displayName: 'New User',
};

const credentials = { email: 'user@example.com', password: 'Password1' };
const authUser = { id: 'user-1', email: credentials.email };
const authSession = {
	access_token: 'access-token',
	refresh_token: 'refresh-token',
	expires_in: 3600,
	expires_at: 1_700_000_000,
};

describe('AuthService', () => {
	const service = new AuthService();

	beforeEach(() => {
		from.mockReset().mockImplementation(builder);
		selectSingle.mockReset().mockResolvedValue(NOT_FOUND);
		profileDelete.mockReset().mockResolvedValue({ error: null });
		profileInsert.mockReset().mockResolvedValue({ error: null });
		createUser.mockReset().mockResolvedValue({ data: { user: { id: 'new-id' } }, error: null });
		deleteUser.mockReset().mockResolvedValue({ data: {}, error: null });
		signInWithPassword.mockReset();
		findAuthUserIdByEmail.mockReset().mockResolvedValue(null);
		generateAndStore.mockReset().mockResolvedValue('123456');
		sendVerificationEmail.mockReset().mockResolvedValue(undefined);
		verification.enabled = true;
	});

	describe('register', () => {
		it('creates an unconfirmed user and its profile, mails a code and returns no session', async () => {
			const result = await service.register(registration);

			expect(result.requiresVerification).toBe(true);
			expect(result.session).toBeUndefined();
			expect(result.user).toMatchObject({
				id: 'new-id',
				email: registration.email,
				username: registration.username,
			});
			expect(createUser).toHaveBeenCalledWith({
				email: registration.email,
				password: registration.password,
				email_confirm: false,
			});
			expect(profileInsert).toHaveBeenCalledWith('user_profiles', {
				id: 'new-id',
				username: registration.username,
				display_name: registration.displayName,
				email_verified: false,
			});
			expect(generateAndStore).toHaveBeenCalledWith('new-id');
			expect(sendVerificationEmail).toHaveBeenCalledWith(registration.email, '123456');
			expect(deleteUser).not.toHaveBeenCalled();
		});

		it('removes the new account and answers 503 EMAIL_UNAVAILABLE when the code cannot be mailed', async () => {
			sendVerificationEmail.mockRejectedValue(new Error('Invalid login: 535 bad credentials'));

			const error = await caught(service.register(registration));

			expect(error).toMatchObject({ statusCode: 503, code: 'EMAIL_UNAVAILABLE' });
			expect(profileDelete).toHaveBeenCalledWith('user_profiles', 'id', 'new-id');
			expect(deleteUser).toHaveBeenCalledWith('new-id');
		});

		it('with EMAIL_VERIFICATION_ENABLED=false, creates a verified account and signs it in', async () => {
			verification.enabled = false;
			signInWithPassword.mockResolvedValue({
				data: { user: { id: 'new-id', email: registration.email }, session: authSession },
				error: null,
			});
			selectSingle.mockImplementation((_table: string, columns: string) =>
				Promise.resolve(
					columns.includes('email_verified, google_id')
						? {
								data: {
									username: registration.username,
									display_name: registration.displayName,
									email_verified: true,
									google_id: null,
									facebook_id: null,
								},
								error: null,
							}
						: NOT_FOUND
				)
			);

			const result = await service.register(registration);

			expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email_confirm: true }));
			expect(profileInsert).toHaveBeenCalledWith(
				'user_profiles',
				expect.objectContaining({ id: 'new-id', email_verified: true })
			);
			expect(generateAndStore).not.toHaveBeenCalled();
			expect(sendVerificationEmail).not.toHaveBeenCalled();
			expect(result.requiresVerification).toBe(false);
			expect(result.session).toMatchObject({ accessToken: 'access-token' });
		});

		it('answers 409 EMAIL_ALREADY_EXISTS when the email belongs to a verified account', async () => {
			findAuthUserIdByEmail.mockResolvedValue('verified-id');
			selectSingle.mockResolvedValue({ data: { email_verified: true }, error: null });

			const error = await caught(service.register(registration));

			expect(error).toBeInstanceOf(AppError);
			expect(error).toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
			expect(createUser).not.toHaveBeenCalled();
			expect(deleteUser).not.toHaveBeenCalled();
		});

		it('replaces an unverified account that holds the same email', async () => {
			findAuthUserIdByEmail.mockResolvedValue('stale-id');
			selectSingle.mockImplementation((_table: string, columns: string) =>
				Promise.resolve(
					columns === 'email_verified'
						? { data: { email_verified: false }, error: null }
						: NOT_FOUND
				)
			);

			const result = await service.register(registration);

			expect(profileDelete).toHaveBeenCalledWith('user_profiles', 'id', 'stale-id');
			expect(deleteUser).toHaveBeenCalledWith('stale-id');
			expect(createUser).toHaveBeenCalledTimes(1);
			expect(result).toMatchObject({ requiresVerification: true, user: { id: 'new-id' } });
		});

		it('answers 409 USERNAME_TAKEN when the username exists', async () => {
			selectSingle.mockResolvedValue({ data: { username: registration.username }, error: null });

			const error = await caught(service.register(registration));

			expect(error).toMatchObject({ statusCode: 409, code: 'USERNAME_TAKEN' });
			expect(createUser).not.toHaveBeenCalled();
		});

		it('deletes the new auth user and answers 500 PROFILE_ERROR when the profile insert fails', async () => {
			profileInsert.mockResolvedValue({ error: { message: 'insert failed' } });

			const error = await caught(service.register(registration));

			expect(error).toMatchObject({ statusCode: 500, code: 'PROFILE_ERROR' });
			expect(deleteUser).toHaveBeenCalledWith('new-id');
			expect(sendVerificationEmail).not.toHaveBeenCalled();
		});
	});

	describe('login', () => {
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
});
