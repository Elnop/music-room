import { useState } from 'react';
import { useLinkedProviders } from '@/features/user/features/auth/features/linked-accounts/hooks/useLinkedProviders';
import {
	useLinkAccount,
	useUnlinkAccount,
} from '@/features/user/features/auth/features/linked-accounts/hooks/useAccountLinking';
import { useLoadErrorToast } from '@/features/user/features/auth/features/linked-accounts/hooks/useLoadErrorToast';
import { useProviderButtons } from '@/features/user/features/auth/shared/sign-in/hooks/useProviderButtons';
import type { OAuthProvider } from '@/features/user/features/auth/authTypes';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import type { LinkedAccountsScreen } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsTypes';

export function useLinkedAccountsScreen(): LinkedAccountsScreen {
	const providersQuery = useLinkedProviders();
	const [pending, setPending] = useState<OAuthProvider | null>(null);
	const onLink = useLinkAccount(setPending);
	const onUnlink = useUnlinkAccount(setPending);
	useLoadErrorToast(providersQuery);

	return {
		bottomPadding: useBottomPadding(),
		isLoading: providersQuery.isLoading,
		linkedProviders: providersQuery.data,
		actions: {
			pending,
			onLink,
			onUnlink,
			googleButton: useProviderButtons(() => onLink('google'), 'row'),
		},
	};
}
