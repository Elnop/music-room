import React from 'react';
import { usePrivacySettingsScreen } from '@/features/user/features/profile/features/privacy-settings/usePrivacySettingsScreen';
import { PrivacySettingsView } from '@/features/user/features/profile/features/privacy-settings/components/presenters/PrivacySettingsView';

export function PrivacySettingsContainer() {
	const {
		theme,
		bottomPadding,
		isLoading,
		isSaving,
		privacy,
		hasChanges,
		handleVisibilityChange,
		handleSave,
	} = usePrivacySettingsScreen();

	return (
		<PrivacySettingsView
			theme={theme}
			bottomPadding={bottomPadding}
			isLoading={isLoading}
			isSaving={isSaving}
			privacy={privacy}
			hasChanges={hasChanges}
			onVisibilityChange={handleVisibilityChange}
			onSave={handleSave}
		/>
	);
}
