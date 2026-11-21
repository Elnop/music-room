import React from 'react';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { SettingsContainer } from '@/features/user/features/settings/components/SettingsContainer';
import { BackendUrlFieldContainer } from '@/features/shell/components/orchestrators/BackendUrlFieldContainer';

export function SettingsScreen() {
	return (
		<PlanContainer>
			{plan => (
				<SettingsContainer subscription={plan} backendUrlField={<BackendUrlFieldContainer />} />
			)}
		</PlanContainer>
	);
}
