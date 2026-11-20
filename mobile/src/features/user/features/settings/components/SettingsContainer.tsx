import React from 'react';
import { useSettingsScreen } from '@/features/user/features/settings/useSettingsScreen';
import { SettingsView } from '@/features/user/features/settings/components/presenters/SettingsView';
import type { PlanState } from '@/features/subscription/lib/subscription';

interface SettingsContainerProps {
	subscription: PlanState;
	backendUrlField: React.ReactNode;
}

export function SettingsContainer({ subscription, backendUrlField }: SettingsContainerProps) {
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
			backendUrlField={backendUrlField}
		/>
	);
}
