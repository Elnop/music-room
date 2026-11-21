import React from 'react';
import { GoogleLinkSlot } from '@/features/user/features/auth/features/linked-accounts/components/presenters/GoogleLinkSlot';
import { LinkToggleButton } from '@/features/user/features/auth/features/linked-accounts/components/presenters/LinkToggleButton';
import type { OAuthProvider } from '@/features/user/features/auth/authTypes';
import type { LinkActions } from '@/features/user/features/auth/features/linked-accounts/linkedAccountsTypes';

type ProviderLinkActionProps = {
	provider: OAuthProvider;
	linked: boolean;
	actions: LinkActions;
};

export function ProviderLinkAction({ provider, linked, actions }: ProviderLinkActionProps) {
	const { pending, googleButton } = actions;
	const disabled = pending !== null;

	if (provider === 'google' && googleButton && !linked && pending !== provider) {
		return <GoogleLinkSlot slot={googleButton} disabled={disabled} />;
	}

	return (
		<LinkToggleButton
			provider={provider}
			linked={linked}
			pending={pending === provider}
			disabled={disabled}
			onPress={() => (linked ? actions.onUnlink(provider) : actions.onLink(provider))}
		/>
	);
}
