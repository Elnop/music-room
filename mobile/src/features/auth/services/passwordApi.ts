import { apiRequest } from '@/shared/services/api';
import type { MessageResponse, ResendStatus } from '@/features/auth/types';

/** Sends the password reset code by email. */
export function forgotPassword(email: string): Promise<MessageResponse> {
	return apiRequest('/api/auth/forgot-password', {
		method: 'POST',
		body: JSON.stringify({ email }),
	});
}

export function resetPassword(
	email: string,
	code: string,
	newPassword: string
): Promise<MessageResponse> {
	return apiRequest('/api/auth/reset-password', {
		method: 'POST',
		body: JSON.stringify({ email, code, newPassword }),
	});
}

/** Whether a new reset code may be sent now, or in how many seconds. */
export function canResendResetCode(email: string): Promise<ResendStatus> {
	return apiRequest(`/api/auth/reset-password/can-resend?email=${encodeURIComponent(email)}`, {
		method: 'GET',
	});
}
