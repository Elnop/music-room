import { apiRequest } from '@/shared/backend/lib/api';
import { postJson } from '@/features/user/features/auth/shared/sign-in/lib/postJson';
import type {
	LoginInput,
	RegisterInput,
} from '@/features/user/features/auth/shared/sign-in/types/authInputTypes';
import type { AuthResponse } from '@/features/user/features/auth/authTypes';

export function register(data: RegisterInput): Promise<AuthResponse> {
	const { email, password, username, displayName } = data;
	return postJson('/api/auth/register', { email, password, username, displayName });
}

export function login({ email, password }: LoginInput): Promise<AuthResponse> {
	return postJson('/api/auth/login', { email, password });
}

export function refreshToken(refreshToken: string): Promise<AuthResponse> {
	return postJson('/api/auth/refresh', { refreshToken });
}

export async function logout(accessToken: string): Promise<void> {
	await apiRequest<void>('/api/auth/logout', {
		method: 'POST',
		headers: { Authorization: `Bearer ${accessToken}` },
	});
}
