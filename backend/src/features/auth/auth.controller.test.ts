import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { login, logout, me, refreshToken, register } from '@/features/auth/auth.controller.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { mockResponse } from '@/test/mock-response.js';

const mocks = vi.hoisted(() => ({
	register: vi.fn(),
	login: vi.fn(),
	logout: vi.fn(),
	refreshToken: vi.fn(),
	getUserProfile: vi.fn(),
	resetFailedAttempts: vi.fn(),
	recordFailedAttempt: vi.fn(),
	recordIPActivity: vi.fn(),
}));

vi.mock('@/features/auth/services/registration.service.js', () => ({ register: mocks.register }));
vi.mock('@/features/auth/services/login.service.js', () => ({ login: mocks.login }));
vi.mock('@/features/auth/services/session.service.js', () => ({
	logout: mocks.logout,
	refreshToken: mocks.refreshToken,
}));
vi.mock('@/features/auth/utils/auth.helpers.js', () => ({ getUserProfile: mocks.getUserProfile }));
vi.mock('@/shared/services/brute-force.service.js', () => ({
	bruteForceService: {
		resetFailedAttempts: mocks.resetFailedAttempts,
		recordFailedAttempt: mocks.recordFailedAttempt,
		recordIPActivity: mocks.recordIPActivity,
	},
}));

const result = { user: { id: 'user-a' }, session: { accessToken: 'access' } };

function request(fields: Record<string, unknown>): Request {
	return { ip: '10.0.0.1', headers: {}, ...fields } as unknown as Request;
}

beforeEach(() => {
	for (const mock of Object.values(mocks)) mock.mockReset();
	mocks.recordFailedAttempt.mockResolvedValue({ failedAttempts: 1, remainingAttempts: 4 });
});

describe('auth.controller register', () => {
	it('answers 201 with the registration result', async () => {
		mocks.register.mockResolvedValue(result);
		const body = { email: 'a@example.com', password: 'Password1', username: 'alice' };
		const res = mockResponse();

		await register(request({ body }), res as unknown as Response);

		expect(mocks.register).toHaveBeenCalledWith(body);
		expect(res.statusCode).toBe(201);
		expect(res.body).toMatchObject({ success: true, data: result });
	});
});

describe('auth.controller login', () => {
	const body = { email: 'a@example.com', password: 'secret' };

	it('resets the failed attempts on success', async () => {
		mocks.login.mockResolvedValue(result);
		const res = mockResponse();

		await login(request({ body }), res as unknown as Response);

		expect(mocks.resetFailedAttempts).toHaveBeenCalledWith('a@example.com', '10.0.0.1');
		expect(mocks.recordFailedAttempt).not.toHaveBeenCalled();
		expect(res.body).toMatchObject({ success: true, data: result });
	});

	it('records a failed attempt and rethrows the error', async () => {
		const failure = new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
		mocks.login.mockRejectedValue(failure);

		await expect(login(request({ body }), mockResponse() as unknown as Response)).rejects.toBe(
			failure
		);

		expect(mocks.recordFailedAttempt).toHaveBeenCalledWith('a@example.com', '10.0.0.1');
		expect(mocks.recordIPActivity).toHaveBeenCalledWith('10.0.0.1');
		expect(mocks.resetFailedAttempts).not.toHaveBeenCalled();
	});

	it('counts an invalid body as a failed attempt too', async () => {
		const error = await login(
			request({ body: { password: 'x' } }),
			mockResponse() as unknown as Response
		).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ZodError);
		expect(mocks.recordFailedAttempt).toHaveBeenCalledWith('unknown', '10.0.0.1');
		expect(mocks.login).not.toHaveBeenCalled();
	});
});

describe('auth.controller logout', () => {
	const logoutRequest = () =>
		request({ headers: { authorization: 'Bearer access-token' }, user: { id: 'user-a' } });

	it('passes the bearer token and user id to the service and answers 200', async () => {
		mocks.logout.mockResolvedValue(undefined);
		const res = mockResponse();

		await logout(logoutRequest(), res as unknown as Response);

		expect(mocks.logout).toHaveBeenCalledWith('access-token', 'user-a');
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true });
	});

	it('lets an AppError from the service through', async () => {
		const failure = new AppError(500, 'Session could not be ended', 'LOGOUT_FAILED');
		mocks.logout.mockRejectedValue(failure);
		const res = mockResponse();

		await expect(logout(logoutRequest(), res as unknown as Response)).rejects.toBe(failure);
		expect(res.body).toBeUndefined();
	});
});

describe('auth.controller refreshToken and me', () => {
	it('refreshes the session with the body refresh token', async () => {
		mocks.refreshToken.mockResolvedValue(result);
		const res = mockResponse();

		await refreshToken(request({ body: { refreshToken: 'refresh' } }), res as unknown as Response);

		expect(mocks.refreshToken).toHaveBeenCalledWith('refresh');
		expect(res.body).toMatchObject({ success: true, data: result });
	});

	it('answers the profile of the signed-in user', async () => {
		mocks.getUserProfile.mockResolvedValue({ id: 'user-a' });
		const res = mockResponse();

		await me(request({ user: { id: 'user-a' } }), res as unknown as Response);

		expect(mocks.getUserProfile).toHaveBeenCalledWith('user-a');
		expect(res.body).toMatchObject({ data: { user: { id: 'user-a' } } });
	});
});
