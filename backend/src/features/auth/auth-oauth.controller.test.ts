import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { linkProvider, unlinkProvider } from '@/features/auth/auth-oauth.controller.js';
import { errorHandler } from '@/shared/middleware/error-handler.js';
import { mockResponse } from '@/test/mock-response.js';

const { link, unlink } = vi.hoisted(() => ({ link: vi.fn(), unlink: vi.fn() }));

vi.mock('@/features/auth/services/provider-link.service.js', () => ({ linkProvider: link }));
vi.mock('@/features/auth/services/provider.service.js', () => ({
	unlinkProvider: unlink,
	getLinkedProviders: vi.fn(),
}));

describe('auth-oauth.controller linkProvider', () => {
	beforeEach(() => {
		link.mockReset();
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

		const error = await linkProvider(req, res as unknown as Response).catch((e: unknown) => e);

		expect(link).not.toHaveBeenCalled();
		errorHandler(error as Error, req, res as unknown as Response, vi.fn());
		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
	});

	it('links the provider with the token of its body', async () => {
		link.mockResolvedValue({ providers: [] });
		const req = {
			params: { provider: 'facebook' },
			body: { accessToken: 'facebook-token' },
			user: { id: 'user-a' },
		} as unknown as Request;
		const res = mockResponse();

		await linkProvider(req, res as unknown as Response);

		expect(link).toHaveBeenCalledWith('user-a', 'facebook', 'facebook-token');
		expect(res.body).toMatchObject({ success: true, data: { providers: [] } });
	});
});

describe('auth-oauth.controller unlinkProvider', () => {
	beforeEach(() => {
		unlink.mockReset();
	});

	it('answers 400 INVALID_PROVIDER for an unknown provider', async () => {
		const req = { params: { provider: 'github' }, user: { id: 'user-a' } } as unknown as Request;

		await expect(unlinkProvider(req, mockResponse() as unknown as Response)).rejects.toMatchObject({
			statusCode: 400,
			code: 'INVALID_PROVIDER',
		});
		expect(unlink).not.toHaveBeenCalled();
	});

	it('unlinks a known provider', async () => {
		unlink.mockResolvedValue(undefined);
		const req = { params: { provider: 'google' }, user: { id: 'user-a' } } as unknown as Request;
		const res = mockResponse();

		await unlinkProvider(req, res as unknown as Response);

		expect(unlink).toHaveBeenCalledWith('user-a', 'google');
		expect(res.body).toMatchObject({ data: { message: 'google unlinked successfully' } });
	});
});
