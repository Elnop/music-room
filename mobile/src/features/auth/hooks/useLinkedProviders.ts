import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useAuthStore } from '@/features/auth/stores/authStore';
import * as providersApi from '@/features/auth/services/providersApi';
import { signInWithGoogle } from '@/features/auth/services/googleSignIn';
import { signInWithFacebook } from '@/features/auth/services/facebookSignIn';
import type { LinkedProvidersResponse, OAuthProvider } from '@/features/auth/types';
import { registerLinkedAccountsBridge } from '@/shared/services/linkedAccountsBridge';
import { useProviderButtons } from './useProviderButtons';

/** The screens using these hooks are signed in. */
function accessToken(): string {
	const token = useAuthStore.getState().accessToken;
	if (!token) throw new Error('No access token available');
	return token;
}

function useProvidersKey() {
	const userId = useAuthStore(state => state.user?.id ?? '');
	return queryKeys.auth.providers(userId);
}

/** Fetched on every visit, without retry. */
function useLinkedProviders() {
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

/** A cancelled provider sign-in rejects with Error('SIGN_IN_CANCELLED') before any request. */
function useLinkProvider() {
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

/** Refetches before resolving: a failed refetch fails the unlink. */
function useUnlinkProvider() {
	const queryKey = useProvidersKey();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (provider: OAuthProvider) => {
			await providersApi.unlinkProvider(accessToken(), provider);
			await queryClient.refetchQueries({ queryKey, type: 'active' }, { throwOnError: true });
		},
	});
}

registerLinkedAccountsBridge({
	useLinkedProviders,
	useLinkProvider,
	useUnlinkProvider,
	useGoogleButton: useProviderButtons,
});
