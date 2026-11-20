import React from 'react';
import { useSettingsScreen } from '@/features/profile/settings/useSettingsScreen';
import { SettingsView } from '@/features/profile/settings/components/presenters/SettingsView';

export function SettingsContainer() {
	const { theme, bottomPadding, plan, isChangingPlan, handleTogglePremium, openPrivacyPolicy } =
		useSettingsScreen();

	return (
		<SettingsView
			theme={theme}
			bottomPadding={bottomPadding}
			plan={plan}
			isChangingPlan={isChangingPlan}
			onTogglePremium={handleTogglePremium}
			onOpenPrivacyPolicy={openPrivacyPolicy}
		/>
	);
}
