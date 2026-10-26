// Browser variant: the native Google SDK does not exist on the web, so its button is hidden.

export function configureGoogleSignIn(): void {}

export function signInWithGoogle(): Promise<string> {
	return Promise.reject(new Error('Google Sign-In is not available in the browser'));
}
