import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '@/features/auth/services/session.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { getUser, signOut, isRevoked, revoke } = vi.hoisted(() => ({
	getUser: vi.fn(),
	signOut: vi.fn(),
	isRevoked: vi.fn(),
	revoke: vi.fn(),
}));

vi.mock('@/shared/config/supabase.js', () => ({
	supabase: { auth: { getUser, admin: { signOut } } },
	createSignInClient: vi.fn(),
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
