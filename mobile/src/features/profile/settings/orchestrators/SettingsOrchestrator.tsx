import React from 'react';
import { useSettingsScreen } from '@/features/profile/settings/hooks/useSettingsScreen';
import { SettingsView } from '@/features/profile/settings/presenters/SettingsView';

export function SettingsOrchestrator() {
	const { theme, playerHeight } = useSettingsScreen();

	return <SettingsView theme={theme} playerHeight={playerHeight} />;
}
