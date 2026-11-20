import { useMutation } from '@tanstack/react-query';
import { signInWithProvider } from '@/features/user/features/auth/shared/sign-in/lib/signIn';
import { oauthErrorMessage } from '@/features/user/features/auth/shared/sign-in/lib/oauthErrors';
import { isSignInCancelled } from '@/features/user/features/auth/shared/sign-in/lib/signInCancelled';
import type { OAuthProvider } from '@/features/user/features/auth/types';

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
