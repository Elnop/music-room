import React from 'react';
import { useSettingsScreen } from '@/features/profile/settings/hooks/useSettingsScreen';
import { SettingsView } from '@/features/profile/settings/components/presenters/SettingsView';

export function SettingsOrchestrator() {
	const { theme, bottomPadding, plan, isChangingPlan, handleTogglePremium } = useSettingsScreen();

	return (
		<SettingsView
			theme={theme}
			bottomPadding={bottomPadding}
			plan={plan}
			isChangingPlan={isChangingPlan}
			onTogglePremium={handleTogglePremium}
		/>
	);
}
