import { postJson } from '@/features/user/features/auth/shared/sign-in/lib/postJson';
import type { AuthResponse, MessageResponse } from '@/features/user/features/auth/authTypes';

export function verifyEmail(userId: string, code: string): Promise<AuthResponse> {
	return postJson('/api/auth/verify-email', { userId, code });
}

export function resendVerificationCode(userId: string, email: string): Promise<MessageResponse> {
	return postJson('/api/auth/resend-verification', { userId, email });
}
