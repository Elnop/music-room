import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '@/features/auth/auth.controller.js';
import { AppError, errorHandler } from '@/shared/middleware/error-handler.js';

const { linkProvider, logout } = vi.hoisted(() => ({ linkProvider: vi.fn(), logout: vi.fn() }));

vi.mock('@/features/auth/auth.service.js', () => ({
	AuthService: class {
		linkProvider = linkProvider;
		logout = logout;
	},
}));

function mockResponse() {
	const res = {
		statusCode: 200,
		body: undefined as unknown,
		status(code: number) {
			res.statusCode = code;
			return res;
		},
		json(body: unknown) {
			res.body = body;
			return res;
		},
	};
	return res;
}

describe('AuthController.linkProvider', () => {
	beforeEach(() => {
		linkProvider.mockReset();
	});

	it('answers 400 VALIDATION_ERROR when /google/link gets a Facebook body', async () => {
		const req = {
			params: { provider: 'google' },
			body: { accessToken: 'facebook-token' },
			user: { id: 'user-a' },
			path: '/providers/google/link',
			method: 'POST',
		} as unknown as Request;
		const res = mockResponse();
		const next = vi.fn();

		await new AuthController().linkProvider(req, res as unknown as Response, next as NextFunction);

		expect(linkProvider).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);

		const [error] = next.mock.calls[0] as [Error];
		errorHandler(error, req, res as unknown as Response, vi.fn());

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
	});
});

describe('AuthController.logout', () => {
	beforeEach(() => {
		logout.mockReset();
	});

	function logoutRequest() {
		return {
			headers: { authorization: 'Bearer access-token' },
			user: { id: 'user-a' },
			path: '/logout',
			method: 'POST',
		} as unknown as Request;
	}

	it('passes the bearer token and user id to the service and answers 200', async () => {
		logout.mockResolvedValue(undefined);
		const res = mockResponse();
		const next = vi.fn();

		await new AuthController().logout(
			logoutRequest(),
			res as unknown as Response,
			next as NextFunction
		);

		expect(logout).toHaveBeenCalledWith('access-token', 'user-a');
		expect(next).not.toHaveBeenCalled();
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true });
	});

	it('forwards an AppError from the service to next', async () => {
		const failure = new AppError(500, 'Session could not be ended', 'LOGOUT_FAILED');
		logout.mockRejectedValue(failure);
		const res = mockResponse();
		const next = vi.fn();

		await new AuthController().logout(
			logoutRequest(),
			res as unknown as Response,
			next as NextFunction
		);

		expect(next).toHaveBeenCalledWith(failure);
		expect(res.body).toBeUndefined();
	});
});
