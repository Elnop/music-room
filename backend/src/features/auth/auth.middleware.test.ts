import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authMiddleware } from '@/features/auth/auth.middleware.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { TokenVerifyLimitError } from '@/shared/security/token-verify-limit.js';
import { mockResponse } from '@/test/mock-response.js';

const { verifyToken } = vi.hoisted(() => ({ verifyToken: vi.fn() }));

vi.mock('@/features/auth/services/session.service.js', () => ({ verifyToken }));

async function run() {
	const req = { headers: { authorization: 'Bearer some-token' } } as unknown as Request;
	const res = mockResponse();
	const next = vi.fn();
	await authMiddleware(req, res as unknown as Response, next as NextFunction);
	return { req, res, next };
}

describe('authMiddleware', () => {
	beforeEach(() => {
		verifyToken.mockReset();
	});

	it('answers 503 REVOCATION_UNAVAILABLE when the denylist cannot be checked', async () => {
		verifyToken.mockRejectedValue(
			new AppError(503, 'Session revocation is unavailable', 'REVOCATION_UNAVAILABLE')
		);

		const { res, next } = await run();

		expect(res.statusCode).toBe(503);
		expect(res.body).toMatchObject({
			success: false,
			error: { code: 'REVOCATION_UNAVAILABLE' },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('answers 401 for an expired or invalid token', async () => {
		verifyToken.mockRejectedValue(new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN'));

		const { res, next } = await run();

		expect(res.statusCode).toBe(401);
		expect(res.body).toMatchObject({ success: false, error: { code: 'INVALID_TOKEN' } });
		expect(next).not.toHaveBeenCalled();
	});

	it('answers 401 TOKEN_REVOKED for a token revoked by a logout', async () => {
		verifyToken.mockRejectedValue(new AppError(401, 'Token has been revoked', 'TOKEN_REVOKED'));

		const { res } = await run();

		expect(res.statusCode).toBe(401);
		expect(res.body).toMatchObject({ error: { code: 'TOKEN_REVOKED' } });
	});

	it('answers 429 RATE_LIMIT_EXCEEDED with retryAfter when the IP is blocked', async () => {
		verifyToken.mockRejectedValue(new TokenVerifyLimitError(60_000));

		const before = Date.now();
		const { res, next } = await run();

		expect(res.statusCode).toBe(429);
		expect(res.body).toMatchObject({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED' } });
		const { retryAfter } = (res.body as { error: { details: { retryAfter: string } } }).error
			.details;
		expect(new Date(retryAfter).getTime()).toBeGreaterThanOrEqual(before + 60_000);
		expect(next).not.toHaveBeenCalled();
	});

	it('answers 401 for an error that is not an AppError', async () => {
		verifyToken.mockRejectedValue(new Error('boom'));

		const { res } = await run();

		expect(res.statusCode).toBe(401);
	});

	it('attaches the user and calls next for a valid token', async () => {
		const user = { id: 'user-a', email: 'a@example.com', role: 'authenticated' };
		verifyToken.mockResolvedValue(user);

		const { req, res, next } = await run();

		expect(verifyToken).toHaveBeenCalledWith('some-token');
		expect((req as unknown as { user: unknown }).user).toEqual(user);
		expect(next).toHaveBeenCalledTimes(1);
		expect(res.statusCode).toBe(200);
	});
});
