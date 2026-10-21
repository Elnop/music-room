import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { getUser, signOut, isRevoked, revoke, refreshSession, fetchUserProfile } = vi.hoisted(
	() => ({
		getUser: vi.fn(),
		signOut: vi.fn(),
		isRevoked: vi.fn(),
		revoke: vi.fn(),
		refreshSession: vi.fn(),
		fetchUserProfile: vi.fn(),
	})
);

vi.mock('@/shared/config/supabase.js', () => ({
	supabaseAdmin: { auth: { getUser, admin: { signOut } } },
	createSignInClient: () => ({ auth: { refreshSession } }),
}));

vi.mock('@/features/auth/utils/auth.helpers.js', async importOriginal => ({
	...(await importOriginal<typeof import('@/features/auth/utils/auth.helpers.js')>()),
	fetchUserProfile,
}));

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/features/auth/services/token-revocation.service.js', () => ({
	tokenRevocationService: { isRevoked, revoke },
}));

async function caught(promise: Promise<unknown>): Promise<unknown> {
	return promise.then(
		() => {
			throw new Error('expected a rejection');
		},
		(error: unknown) => error
	);
}

describe('SessionService', () => {
	const service = new SessionService();

	beforeEach(() => {
		getUser.mockReset();
		signOut.mockReset();
		isRevoked.mockReset().mockResolvedValue(false);
		revoke.mockReset().mockResolvedValue(undefined);
		refreshSession.mockReset();
		fetchUserProfile.mockReset();
	});

	describe('refreshToken', () => {
		const refusedBy = (error: Error) => refreshSession.mockResolvedValue({ data: {}, error });

		it('answers 401 INVALID_REFRESH_TOKEN when Supabase refuses the token (4xx)', async () => {
			refusedBy(
				new AuthApiError('Invalid Refresh Token: Already Used', 400, 'refresh_token_already_used')
			);

			const error = await caught(service.refreshToken('revoked'));

			expect(error).toBeInstanceOf(AppError);
			expect(error).toMatchObject({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
		});

		it('answers 401 INVALID_REFRESH_TOKEN when no session comes back', async () => {
			refreshSession.mockResolvedValue({ data: { session: null, user: null }, error: null });

			const error = await caught(service.refreshToken('token'));

			expect(error).toMatchObject({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
		});

		it('answers 503 AUTH_UNAVAILABLE when Supabase is unreachable', async () => {
			refusedBy(new AuthRetryableFetchError('getaddrinfo ENOTFOUND', 0));

			const error = await caught(service.refreshToken('token'));

			expect(error).toMatchObject({ statusCode: 503, code: 'AUTH_UNAVAILABLE' });
		});

		it('answers 503 AUTH_UNAVAILABLE when Supabase fails with a 5xx', async () => {
			refusedBy(new AuthApiError('Internal error', 500, 'unexpected_failure'));

			const error = await caught(service.refreshToken('token'));

			expect(error).toMatchObject({ statusCode: 503, code: 'AUTH_UNAVAILABLE' });
		});

		it('answers 503 AUTH_UNAVAILABLE when Supabase rate-limits the refresh (429)', async () => {
			refusedBy(new AuthApiError('Request rate limit reached', 429, 'over_request_rate_limit'));

			const error = await caught(service.refreshToken('token'));

			expect(error).toMatchObject({ statusCode: 503, code: 'AUTH_UNAVAILABLE' });
		});

		it('answers 503 AUTH_UNAVAILABLE when the Supabase client throws', async () => {
			refreshSession.mockRejectedValue(new Error('fetch failed'));

			const error = await caught(service.refreshToken('token'));

			expect(error).toMatchObject({ statusCode: 503, code: 'AUTH_UNAVAILABLE' });
		});

		it('returns the new session on success', async () => {
			refreshSession.mockResolvedValue({
				data: {
					user: {
						id: 'user-a',
						email: 'a@example.com',
						email_confirmed_at: '2025-01-01T00:00:00Z',
					},
					session: {
						access_token: 'new-access',
						refresh_token: 'new-refresh',
						expires_in: 3600,
						expires_at: 1_900_000_000,
					},
				},
				error: null,
			});
			fetchUserProfile.mockResolvedValue({
				username: 'alice',
				display_name: 'Alice',
				avatar_url: null,
				bio: null,
				created_at: '2025-01-01T00:00:00Z',
				updated_at: '2025-01-01T00:00:00Z',
			});

			const response = await service.refreshToken('valid');

			expect(refreshSession).toHaveBeenCalledWith({ refresh_token: 'valid' });
			expect(response.session).toMatchObject({
				accessToken: 'new-access',
				refreshToken: 'new-refresh',
			});
			expect(response.user).toMatchObject({ id: 'user-a', username: 'alice' });
		});

		it('keeps the profile lookup error instead of answering 401', async () => {
			refreshSession.mockResolvedValue({
				data: {
					user: { id: 'user-a', email: 'a@example.com' },
					session: { access_token: 'a', refresh_token: 'r', expires_in: 3600, expires_at: 1 },
				},
				error: null,
			});
			fetchUserProfile.mockRejectedValue(
				new AppError(500, 'Failed to fetch user profile', 'PROFILE_ERROR')
			);

			const error = await caught(service.refreshToken('valid'));

			expect(error).toMatchObject({ statusCode: 500, code: 'PROFILE_ERROR' });
		});
	});

	describe('verifyToken', () => {
		it('rejects a revoked token with 401 TOKEN_REVOKED without calling Supabase', async () => {
			isRevoked.mockResolvedValue(true);

			const error = await caught(service.verifyToken('old-access-token'));

			expect(error).toBeInstanceOf(AppError);
			expect(error).toMatchObject({ statusCode: 401, code: 'TOKEN_REVOKED' });
			expect(isRevoked).toHaveBeenCalledWith('old-access-token');
			expect(getUser).not.toHaveBeenCalled();
		});

		it('keeps the 503 REVOCATION_UNAVAILABLE from the denylist check', async () => {
			isRevoked.mockRejectedValue(
				new AppError(503, 'Session revocation is unavailable', 'REVOCATION_UNAVAILABLE')
			);

			const error = await caught(service.verifyToken('token'));

			expect(error).toMatchObject({ statusCode: 503, code: 'REVOCATION_UNAVAILABLE' });
			expect(getUser).not.toHaveBeenCalled();
		});

		it('returns the user for a token that is not revoked', async () => {
			getUser.mockResolvedValue({
				data: { user: { id: 'user-a', email: 'a@example.com', role: 'authenticated' } },
				error: null,
			});

			await expect(service.verifyToken('token')).resolves.toEqual({
				id: 'user-a',
				email: 'a@example.com',
				role: 'authenticated',
			});
		});
	});

	describe('logout', () => {
		it('revokes the token, then ends the Supabase session with scope local', async () => {
			signOut.mockResolvedValue({ data: null, error: null });

			await service.logout('access-token', 'user-a');

			expect(revoke).toHaveBeenCalledWith('access-token');
			expect(signOut).toHaveBeenCalledWith('access-token', 'local');
			expect(revoke.mock.invocationCallOrder[0]).toBeLessThan(signOut.mock.invocationCallOrder[0]);
		});

		it('answers 500 LOGOUT_FAILED after revoking when signOut returns an error', async () => {
			signOut.mockResolvedValue({ data: null, error: new Error('GoTrue error') });

			const error = await caught(service.logout('access-token', 'user-a'));

			expect(revoke).toHaveBeenCalledWith('access-token');
			expect(error).toBeInstanceOf(AppError);
			expect(error).toMatchObject({ statusCode: 500, code: 'LOGOUT_FAILED' });
		});

		it('answers 500 LOGOUT_FAILED after revoking when signOut throws', async () => {
			signOut.mockRejectedValue(new Error('fetch failed'));

			const error = await caught(service.logout('access-token', 'user-a'));

			expect(revoke).toHaveBeenCalledWith('access-token');
			expect(error).toBeInstanceOf(AppError);
			expect(error).toMatchObject({ statusCode: 500, code: 'LOGOUT_FAILED' });
		});

		it('does not call Supabase when the token cannot be revoked', async () => {
			revoke.mockRejectedValue(
				new AppError(503, 'Session revocation is unavailable', 'REVOCATION_UNAVAILABLE')
			);

			const error = await caught(service.logout('access-token', 'user-a'));

			expect(error).toMatchObject({ statusCode: 503, code: 'REVOCATION_UNAVAILABLE' });
			expect(signOut).not.toHaveBeenCalled();
		});
	});
});
