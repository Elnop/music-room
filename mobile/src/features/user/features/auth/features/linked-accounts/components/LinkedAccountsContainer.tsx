import React from 'react';
import { useLinkedAccountsScreen } from '@/features/user/features/auth/features/linked-accounts/hooks/useLinkedAccountsScreen';
import { LinkedAccountsView } from '@/features/user/features/auth/features/linked-accounts/components/presenters/LinkedAccountsView';

export function LinkedAccountsContainer() {
	const {
		theme,
		bottomPadding,
		isLoading,
		linkedProviders,
		pending,
		handleLink,
		handleUnlink,
		googleButton,
	} = useLinkedAccountsScreen();

	return (
		<LinkedAccountsView
			theme={theme}
			bottomPadding={bottomPadding}
			isLoading={isLoading}
			linkedProviders={linkedProviders}
			pending={pending}
			onLink={handleLink}
			onUnlink={handleUnlink}
			googleButton={googleButton}
		/>
	);
}
