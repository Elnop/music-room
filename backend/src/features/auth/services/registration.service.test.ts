import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from '@/features/auth/services/registration.service.js';
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
	supabaseAdmin: { from, auth: { admin: { createUser, deleteUser } } },
	createSignInClient: () => ({ auth: { signInWithPassword } }),
}));

vi.mock('@/features/auth/utils/find-auth-user.js', () => ({ findAuthUserIdByEmail }));

vi.mock('@/features/auth/services/email-verification.service.js', () => ({
	generateAndStore,
	sendCode: sendVerificationEmail,
}));

// EMAIL_VERIFICATION_ENABLED, switched per test; the only setting registration reads
// (the code is mailed by the mocked email-verification).
vi.mock('@/features/mail/mail.config.js', () => ({ verificationConfig: verification }));

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

/** Mock of one supabase.from(table) chain: select/eq/single, delete/eq and insert hit the spies below. */
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

const authSession = {
	access_token: 'access-token',
	refresh_token: 'refresh-token',
	expires_in: 3600,
	expires_at: 1_700_000_000,
};

describe('registration.service', () => {
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
});
