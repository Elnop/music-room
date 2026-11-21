import React from 'react';
import { ProfileScreenFrame } from '@/features/user/shared/profile-layout/ProfileScreenFrame';
import { LinkedAccountsList } from '@/features/user/features/auth/features/linked-accounts/components/presenters/LinkedAccountsList';
import type { LinkedAccountsScreen } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsTypes';

type LinkedAccountsViewProps = {
	screen: LinkedAccountsScreen;
};

export function LinkedAccountsView({ screen }: LinkedAccountsViewProps) {
	const { linkedProviders } = screen;

	return (
		<ProfileScreenFrame
			subtitle="Choisissez comment vous connecter à Zumik"
			bottomPadding={screen.bottomPadding}
			isLoading={screen.isLoading}
			errorMessage={!linkedProviders ? 'Impossible de charger les comptes liés' : null}
		>
			{linkedProviders && (
				<LinkedAccountsList linkedProviders={linkedProviders} actions={screen.actions} />
			)}
		</ProfileScreenFrame>
	);
}
