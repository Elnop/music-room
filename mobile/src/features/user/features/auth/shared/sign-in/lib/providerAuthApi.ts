import { postJson } from '@/features/user/features/auth/shared/sign-in/lib/postJson';
import type { AuthResponse } from '@/features/user/features/auth/authTypes';

export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
	return postJson('/api/auth/google', { idToken });
}

export function loginWithFacebook(accessToken: string): Promise<AuthResponse> {
	return postJson('/api/auth/facebook', { accessToken });
}
