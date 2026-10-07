import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from '@/features/auth/auth.controller.js';
import { errorHandler } from '@/shared/middleware/error-handler.js';

const { linkProvider } = vi.hoisted(() => ({ linkProvider: vi.fn() }));

vi.mock('@/features/auth/auth.service.js', () => ({
	AuthService: class {
		linkProvider = linkProvider;
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
