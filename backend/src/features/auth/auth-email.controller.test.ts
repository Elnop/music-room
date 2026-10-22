import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resendVerification, verifyEmail } from '@/features/auth/auth-email.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const { verify, resend } = vi.hoisted(() => ({ verify: vi.fn(), resend: vi.fn() }));

vi.mock('@/features/auth/services/verify-email.service.js', () => ({ verifyEmail: verify }));
vi.mock('@/features/auth/services/verification-resend.service.js', () => ({ resendCode: resend }));

const userId = '6f1c1a52-5b4e-4b8e-9d55-0c6a8a1f2b3c';

function request(body: unknown): Request {
	return { ip: '10.0.0.1', body } as unknown as Request;
}

beforeEach(() => {
	verify.mockReset();
	resend.mockReset();
});

describe('auth-email.controller', () => {
	it('verifyEmail checks the code from this IP and answers the session', async () => {
		verify.mockResolvedValue({ message: 'Email verified successfully' });
		const res = mockResponse();

		await verifyEmail(request({ userId, code: '123456' }), res as unknown as Response);

		expect(verify).toHaveBeenCalledWith(userId, '123456', '10.0.0.1');
		expect(res.body).toMatchObject({
			success: true,
			data: { message: 'Email verified successfully' },
		});
	});

	it('verifyEmail refuses a code that is not 6 digits before any lookup', async () => {
		await expect(
			verifyEmail(request({ userId, code: '12ab' }), mockResponse() as unknown as Response)
		).rejects.toMatchObject({ name: 'ZodError' });
		expect(verify).not.toHaveBeenCalled();
	});

	it('resendVerification gives the same answer whatever the service did', async () => {
		resend.mockResolvedValue(undefined);
		const res = mockResponse();

		await resendVerification(
			request({ userId, email: 'a@example.com' }),
			res as unknown as Response
		);

		expect(resend).toHaveBeenCalledWith(userId, 'a@example.com', '10.0.0.1');
		expect(res.body).toMatchObject({
			data: { message: 'Verification code sent. Please check your email.' },
		});
	});
});
