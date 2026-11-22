import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { authStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import { useAuthState } from '@/features/user/features/auth/shared/sign-in/hooks/useAuthState';
import * as providersApi from '@/features/user/features/auth/features/linked-accounts/providersApi';
import { signInWithGoogle } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn';
import { signInWithFacebook } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn';
import type {
	LinkedProvidersResponse,
	OAuthProvider,
} from '@/features/user/features/auth/authTypes';

function accessToken(): string {
	const token = authStore.getState().accessToken;
	if (!token) throw new Error('No access token available');
	return token;
}

function useSignedInUserId(): string {
	return useAuthState((state) => state.user?.id ?? '');
}

export function useLinkedProviders() {
	const userId = useSignedInUserId();
	const signedIn = useAuthState((state) => state.accessToken !== null);
	return useQuery({
		queryKey: queryKeys.auth.providers(userId),
		queryFn: () => providersApi.getLinkedProviders(accessToken()),
		select: (response: LinkedProvidersResponse) => response.providers,
		enabled: signedIn,
		staleTime: STALE.none,
		refetchOnMount: 'always',
		retry: false,
	});
}

export function useLinkProvider() {
	const userId = useSignedInUserId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (provider: OAuthProvider) => {
			const token = provider === 'google' ? await signInWithGoogle() : await signInWithFacebook();
			return providersApi.linkProvider(accessToken(), provider, token);
		},
		onSuccess: (response) => queryClient.setQueryData(queryKeys.auth.providers(userId), response),
	});
}

export function useUnlinkProvider() {
	const userId = useSignedInUserId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (provider: OAuthProvider) => {
			await providersApi.unlinkProvider(accessToken(), provider);
			await queryClient.refetchQueries(
				{ queryKey: queryKeys.auth.providers(userId), type: 'active' },
				{ throwOnError: true },
			);
		},
	});
}
