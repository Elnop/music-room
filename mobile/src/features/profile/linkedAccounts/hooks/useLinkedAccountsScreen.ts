import { useCallback, useEffect, useState } from 'react';
import {
	useLinkedProviders,
	useLinkProvider,
	useUnlinkProvider,
	type OAuthProvider,
} from '@/shared/services/linkedAccountsBridge';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { useTheme } from '@/shared/theme/ThemeContext';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError, showSuccess } from '@/shared/utils/toast';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
	google: 'Google',
	facebook: 'Facebook',
};

function isCancelled(error: unknown): boolean {
	return error instanceof Error && error.message === 'SIGN_IN_CANCELLED';
}

export function useLinkedAccountsScreen() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();
	const providersQuery = useLinkedProviders();
	const linkedProviders = providersQuery.data;
	const linkProvider = useLinkProvider().mutateAsync;
	const unlinkProvider = useUnlinkProvider().mutateAsync;

	const [pending, setPending] = useState<OAuthProvider | null>(null);

	const { error: loadError, errorUpdatedAt, isFetchedAfterMount } = providersQuery;
	useEffect(() => {
		if (loadError && isFetchedAfterMount) {
			showError(apiErrorMessage(loadError, 'Impossible de charger les comptes liés'));
		}
	}, [loadError, errorUpdatedAt, isFetchedAfterMount]);

	const handleLink = useCallback(
		async (provider: OAuthProvider) => {
			setPending(provider);
			try {
				await linkProvider(provider);
				showSuccess(`Compte ${PROVIDER_LABELS[provider]} lié`);
			} catch (error) {
				if (!isCancelled(error)) {
					showError(
						apiErrorMessage(error, `Impossible de lier le compte ${PROVIDER_LABELS[provider]}`)
					);
				}
			} finally {
				setPending(null);
			}
		},
		[linkProvider]
	);

	const handleUnlink = useCallback(
		async (provider: OAuthProvider) => {
			setPending(provider);
			try {
				await unlinkProvider(provider);
				showSuccess(`Compte ${PROVIDER_LABELS[provider]} délié`);
			} catch (error) {
				showError(
					apiErrorMessage(error, `Impossible de délier le compte ${PROVIDER_LABELS[provider]}`)
				);
			} finally {
				setPending(null);
			}
		},
		[unlinkProvider]
	);

	return {
		theme,
		bottomPadding,
		isLoading: providersQuery.isLoading,
		linkedProviders,
		pending,
		handleLink,
		handleUnlink,
	};
}
