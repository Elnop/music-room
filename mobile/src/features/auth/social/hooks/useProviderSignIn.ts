import { useMutation } from '@tanstack/react-query';
import { signInWithProvider } from '@/features/auth/services/signIn';
import { oauthErrorMessage } from '@/features/auth/services/oauthErrors';
import { isSignInCancelled } from '@/features/auth/services/signInCancelled';
import type { OAuthProvider } from '@/features/auth/types';

interface ProviderSignIn {
	signIn: (provider: OAuthProvider) => void;
	isPending: boolean;
}

/**
 * Google or Facebook sign-in from the login and register screens. A cancel
 * reports nothing; any other failure its French message to `onFailure` (the
 * screen's toast), never after the screen unmounted. RootNavigator shows the
 * app once the session opens.
 */
export function useProviderSignIn(onFailure: (message: string) => void): ProviderSignIn {
	const mutation = useMutation({ mutationFn: signInWithProvider });
	return {
		signIn: provider =>
			mutation.mutate(provider, {
				onError: error => {
					if (!isSignInCancelled(error)) onFailure(oauthErrorMessage(provider, error));
				},
			}),
		isPending: mutation.isPending,
	};
}
