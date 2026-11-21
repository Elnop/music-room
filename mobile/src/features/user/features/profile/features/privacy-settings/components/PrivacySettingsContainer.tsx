import React from 'react';
import { usePrivacySettingsScreen } from '@/features/user/features/profile/features/privacy-settings/hooks/usePrivacySettingsScreen';
import { PrivacySettingsView } from '@/features/user/features/profile/features/privacy-settings/components/presenters/PrivacySettingsView';

export function PrivacySettingsContainer() {
	const screen = usePrivacySettingsScreen();

	return (
		<PrivacySettingsView
			bottomPadding={screen.bottomPadding}
			isLoading={screen.isLoading}
			editing={screen.editing}
			save={screen.save}
		/>
	);
}
