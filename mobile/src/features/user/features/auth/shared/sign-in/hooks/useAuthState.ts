import { useStore } from 'zustand';
import { authStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import type { AuthState } from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

export function useAuthState<T>(selector: (state: AuthState) => T): T {
	return useStore(authStore, selector);
}
