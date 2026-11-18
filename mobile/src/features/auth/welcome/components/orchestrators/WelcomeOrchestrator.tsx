import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { getBuildLabel } from '@/shared/services/deviceService';
import { openExternalUrl } from '@/shared/utils/openExternalUrl';
import { WelcomeView } from '@/features/auth/welcome/components/presenters/WelcomeView';

type WelcomeOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeOrchestrator({ navigation }: WelcomeOrchestratorProps) {
	const [showServer, setShowServer] = useState(false);

	return (
		<WelcomeView
			buildLabel={getBuildLabel()}
			showServer={showServer}
			onToggleServer={() => setShowServer(value => !value)}
			onStart={() => navigation.navigate('Register')}
			onLogin={() => navigation.navigate('Login')}
			onOpenPrivacyPolicy={() => navigation.navigate('PrivacyPolicy')}
			onOpenLink={openExternalUrl}
		/>
	);
}
