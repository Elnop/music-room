import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	canResendResetCode,
	forgotPassword,
	resetPassword,
} from '@/features/auth/auth-password.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const { requestReset, reset, status } = vi.hoisted(() => ({
	requestReset: vi.fn(),
	reset: vi.fn(),
	status: vi.fn(),
}));

vi.mock('@/features/auth/services/password-reset.service.js', () => ({
	requestPasswordReset: requestReset,
	resetPassword: reset,
}));
vi.mock('@/features/auth/services/password-reset-cooldown.service.js', () => ({
	PasswordResetCooldownService: class {
		status = status;
	},
}));

function request(fields: Record<string, unknown>): Request {
	return { ip: '10.0.0.1', ...fields } as unknown as Request;
}

beforeEach(() => {
	requestReset.mockReset();
	reset.mockReset();
	status.mockReset();
});

describe('auth-password.controller', () => {
	it('forgotPassword answers the same message whether the email exists or not', async () => {
		requestReset.mockResolvedValue(undefined);
		const res = mockResponse();

		await forgotPassword(request({ body: { email: 'a@example.com' } }), res as unknown as Response);

		expect(requestReset).toHaveBeenCalledWith('a@example.com', '10.0.0.1');
		expect(res.body).toMatchObject({
			data: { message: 'If this email exists, a reset code has been sent.' },
		});
	});

	it('resetPassword passes the code and the new password to the service', async () => {
		reset.mockResolvedValue(undefined);
		const body = { email: 'a@example.com', code: '123456', newPassword: 'Password1' };
		const res = mockResponse();

		await resetPassword(request({ body }), res as unknown as Response);

		expect(reset).toHaveBeenCalledWith('a@example.com', '123456', 'Password1', '10.0.0.1');
		expect(res.body).toMatchObject({ success: true });
	});

	it('canResendResetCode answers the cooldown status for the query email', async () => {
		status.mockResolvedValue({ canResend: false, remainingSeconds: 42 });
		const res = mockResponse();

		await canResendResetCode(
			request({ query: { email: 'a@example.com' } }),
			res as unknown as Response
		);

		expect(status).toHaveBeenCalledWith('a@example.com', '10.0.0.1');
		expect(res.body).toMatchObject({ data: { canResend: false, remainingSeconds: 42 } });
	});
});
