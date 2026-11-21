import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { useAuthStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import * as providersApi from '@/features/user/features/auth/features/linked-accounts/providersApi';
import { signInWithGoogle } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn';
import { signInWithFacebook } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn';
import type { LinkedProvidersResponse, OAuthProvider } from '@/features/user/features/auth/types';

function accessToken(): string {
	const token = useAuthStore.getState().accessToken;
	if (!token) throw new Error('No access token available');
	return token;
}

function useProvidersKey() {
	const userId = useAuthStore(state => state.user?.id ?? '');
	return queryKeys.auth.providers(userId);
}

export function useLinkedProviders() {
	const queryKey = useProvidersKey();
	const signedIn = useAuthStore(state => state.accessToken !== null);
	return useQuery({
		queryKey,
		queryFn: () => providersApi.getLinkedProviders(accessToken()),
		select: (response: LinkedProvidersResponse) => response.providers,
		enabled: signedIn,
		staleTime: STALE.none,
		refetchOnMount: 'always',
		retry: false,
	});
}

export function useLinkProvider() {
	const queryKey = useProvidersKey();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (provider: OAuthProvider) => {
			const token = provider === 'google' ? await signInWithGoogle() : await signInWithFacebook();
			return providersApi.linkProvider(accessToken(), provider, token);
		},
		onSuccess: response => queryClient.setQueryData(queryKey, response),
	});
}

export function useUnlinkProvider() {
	const queryKey = useProvidersKey();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (provider: OAuthProvider) => {
			await providersApi.unlinkProvider(accessToken(), provider);
			await queryClient.refetchQueries({ queryKey, type: 'active' }, { throwOnError: true });
		},
	});
}
