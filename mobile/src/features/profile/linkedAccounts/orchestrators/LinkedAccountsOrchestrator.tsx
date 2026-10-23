import React from 'react';
import { useLinkedAccountsScreen } from '@/features/profile/linkedAccounts/hooks/useLinkedAccountsScreen';
import { LinkedAccountsView } from '@/features/profile/linkedAccounts/presenters/LinkedAccountsView';

export function LinkedAccountsOrchestrator() {
	const { theme, playerHeight, isLoading, linkedProviders, pending, handleLink, handleUnlink } =
		useLinkedAccountsScreen();

	return (
		<LinkedAccountsView
			theme={theme}
			playerHeight={playerHeight}
			isLoading={isLoading}
			linkedProviders={linkedProviders}
			pending={pending}
			onLink={handleLink}
			onUnlink={handleUnlink}
		/>
	);
}
