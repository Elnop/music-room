// Browser variant: the native Facebook SDK does not exist on the web, so its button is hidden.

export function initializeFacebookSDK(): void {}

export function signInWithFacebook(): Promise<string> {
	return Promise.reject(new Error('Facebook Login is not available in the browser'));
}
