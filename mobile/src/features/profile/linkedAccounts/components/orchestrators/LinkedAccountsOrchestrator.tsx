import React from 'react';
import { useLinkedAccountsScreen } from '@/features/profile/linkedAccounts/hooks/useLinkedAccountsScreen';
import { LinkedAccountsView } from '@/features/profile/linkedAccounts/components/presenters/LinkedAccountsView';

export function LinkedAccountsOrchestrator() {
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
