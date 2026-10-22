/** Message of the error a native sign-in rejects with when the user cancels. */
export const SIGN_IN_CANCELLED = 'SIGN_IN_CANCELLED';

export function isSignInCancelled(error: unknown): boolean {
	return error instanceof Error && error.message === SIGN_IN_CANCELLED;
}
