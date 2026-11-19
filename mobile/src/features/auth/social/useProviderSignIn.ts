import { useMutation } from '@tanstack/react-query';
import { signInWithProvider } from '@/features/auth/services/signIn';
import { oauthErrorMessage } from '@/features/auth/services/oauthErrors';
import { isSignInCancelled } from '@/features/auth/services/signInCancelled';
import type { OAuthProvider } from '@/features/auth/types';

interface ProviderSignIn {
	signIn: (provider: OAuthProvider) => void;
	isPending: boolean;
}

/** A cancel reports nothing; other failures reach `onFailure`, never after unmount. */
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
