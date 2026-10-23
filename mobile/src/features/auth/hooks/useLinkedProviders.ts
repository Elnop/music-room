import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useAuthStore } from '@/features/auth/stores/authStore';
import * as providersApi from '@/features/auth/services/providersApi';
import { signInWithGoogle } from '@/features/auth/services/googleSignIn';
import { signInWithFacebook } from '@/features/auth/services/facebookSignIn';
import type { LinkedProvidersResponse, OAuthProvider } from '@/features/auth/types';
import { registerLinkedAccountsBridge } from '@/shared/services/linkedAccountsBridge';

/** The access token of the session; the screens using these hooks are signed in. */
function accessToken(): string {
	const token = useAuthStore.getState().accessToken;
	if (!token) throw new Error('No access token available');
	return token;
}

function useProvidersKey() {
	const userId = useAuthStore(state => state.user?.id ?? '');
	return queryKeys.auth.providers(userId);
}

/**
 * The sign-in methods linked to the signed-in account (profile, linked
 * accounts): fetched on every visit, without retry, like the screen always did.
 */
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

/**
 * Links a Google or Facebook account: native sign-in, then its token to the
 * backend, whose answer replaces the cached list. A cancelled sign-in rejects
 * with Error('SIGN_IN_CANCELLED') before any request.
 */
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

/**
 * Unlinks a provider, then refetches the list before resolving: a failed
 * refetch fails the unlink, as the screen reports it.
 */
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
});
