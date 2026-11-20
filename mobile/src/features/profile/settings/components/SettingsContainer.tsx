import React from 'react';
import { useSettingsScreen } from '@/features/profile/settings/useSettingsScreen';
import { SettingsView } from '@/features/profile/settings/components/presenters/SettingsView';
import type { PlanState } from '@/features/subscription/lib/subscription';

interface SettingsContainerProps {
	subscription: PlanState;
}

export function SettingsContainer({ subscription }: SettingsContainerProps) {
	const { theme, bottomPadding, plan, isChangingPlan, handleTogglePremium, openPrivacyPolicy } =
		useSettingsScreen(subscription);

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
