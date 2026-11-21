import React from 'react';
import { useLinkedAccountsScreen } from '@/features/user/features/auth/features/linked-accounts/hooks/useLinkedAccountsScreen';
import { LinkedAccountsView } from '@/features/user/features/auth/features/linked-accounts/components/presenters/LinkedAccountsView';

export function LinkedAccountsContainer() {
	const screen = useLinkedAccountsScreen();

	return <LinkedAccountsView screen={screen} />;
}
