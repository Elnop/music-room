import { useCallback } from 'react';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { isSignInCancelled } from '@/features/user/features/auth/shared/sign-in/lib/isSignInCancelled';
import {
	useLinkProvider,
	useUnlinkProvider,
} from '@/features/user/features/auth/features/linked-accounts/hooks/useLinkedProviders';
import { PROVIDER_LABELS } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsConfig';
import type { OAuthProvider } from '@/features/user/features/auth/authTypes';
import type { SetPendingProvider } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsTypes';

type ProviderCall = (provider: OAuthProvider) => Promise<unknown>;

async function whilePending(
	provider: OAuthProvider,
	setPending: SetPendingProvider,
	action: () => Promise<void>
): Promise<void> {
	setPending(provider);
	try {
		await action();
	} finally {
		setPending(null);
	}
}

async function linkAccount(provider: OAuthProvider, link: ProviderCall): Promise<void> {
	const label = PROVIDER_LABELS[provider];
	try {
		await link(provider);
		showSuccess(`Compte ${label} lié`);
	} catch (error) {
		if (!isSignInCancelled(error)) {
			showError(apiErrorMessage(error, `Impossible de lier le compte ${label}`));
		}
	}
}

async function unlinkAccount(provider: OAuthProvider, unlink: ProviderCall): Promise<void> {
	const label = PROVIDER_LABELS[provider];
	try {
		await unlink(provider);
		showSuccess(`Compte ${label} délié`);
	} catch (error) {
		showError(apiErrorMessage(error, `Impossible de délier le compte ${label}`));
	}
}

export function useLinkAccount(setPending: SetPendingProvider) {
	const link = useLinkProvider().mutateAsync;
	return useCallback(
		(provider: OAuthProvider) =>
			whilePending(provider, setPending, () => linkAccount(provider, link)),
		[link, setPending]
	);
}

export function useUnlinkAccount(setPending: SetPendingProvider) {
	const unlink = useUnlinkProvider().mutateAsync;
	return useCallback(
		(provider: OAuthProvider) =>
			whilePending(provider, setPending, () => unlinkAccount(provider, unlink)),
		[unlink, setPending]
	);
}
