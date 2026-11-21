import { useMutation } from '@tanstack/react-query';
import { signInWithProvider } from '@/features/user/features/auth/shared/sign-in/lib/signIn';
import { oauthErrorMessage } from '@/features/user/features/auth/shared/sign-in/lib/oauthErrorMessage';
import { isSignInCancelled } from '@/features/user/features/auth/shared/sign-in/lib/isSignInCancelled';
import type { OAuthProvider } from '@/features/user/features/auth/authTypes';

type ProviderSignIn = {
	signIn: (provider: OAuthProvider) => void;
	isPending: boolean;
};

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
