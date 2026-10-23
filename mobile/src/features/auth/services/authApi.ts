import { apiRequest } from '@/shared/services/api';
import type { LoginInput, RegisterInput } from '@/features/auth/validators';
import type { AuthResponse, MessageResponse } from '@/features/auth/types';

function post<T>(endpoint: string, body: object, headers?: Record<string, string>): Promise<T> {
	return apiRequest<T>(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
}

export function register(data: RegisterInput): Promise<AuthResponse> {
	const { email, password, username, displayName } = data;
	return post('/api/auth/register', { email, password, username, displayName });
}

export function login({ email, password }: LoginInput): Promise<AuthResponse> {
	return post('/api/auth/login', { email, password });
}

export function refreshToken(refreshToken: string): Promise<AuthResponse> {
	return post('/api/auth/refresh', { refreshToken });
}

export async function logout(accessToken: string): Promise<void> {
	await apiRequest<void>('/api/auth/logout', {
		method: 'POST',
		headers: { Authorization: `Bearer ${accessToken}` },
	});
}

export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
	return post('/api/auth/google', { idToken });
}

export function loginWithFacebook(accessToken: string): Promise<AuthResponse> {
	return post('/api/auth/facebook', { accessToken });
}

export function verifyEmail(userId: string, code: string): Promise<AuthResponse> {
	return post('/api/auth/verify-email', { userId, code });
}

export function resendVerificationCode(userId: string, email: string): Promise<MessageResponse> {
	return post('/api/auth/resend-verification', { userId, email });
}
