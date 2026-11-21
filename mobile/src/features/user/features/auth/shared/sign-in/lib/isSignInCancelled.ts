import { SIGN_IN_CANCELLED } from '@/features/user/features/auth/shared/sign-in/configs/signInConfig';

export function isSignInCancelled(error: unknown): boolean {
	return error instanceof Error && error.message === SIGN_IN_CANCELLED;
}
