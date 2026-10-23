import React from 'react';
import { usePrivacySettingsScreen } from '@/features/profile/privacySettings/hooks/usePrivacySettingsScreen';
import { PrivacySettingsView } from '@/features/profile/privacySettings/components/presenters/PrivacySettingsView';

export function PrivacySettingsOrchestrator() {
	const {
		theme,
		playerHeight,
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
			playerHeight={playerHeight}
			isLoading={isLoading}
			isSaving={isSaving}
			privacy={privacy}
			hasChanges={hasChanges}
			onVisibilityChange={handleVisibilityChange}
			onSave={handleSave}
		/>
	);
}
