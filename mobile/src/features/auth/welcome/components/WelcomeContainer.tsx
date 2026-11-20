import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { getBuildLabel } from '@/shared/backend/deviceService';
import { OPEN_LINK_FAILED, openExternalUrl } from '@/shared/external-links/openExternalUrl';
import { showError } from '@/shared/theme/lib/toast';
import { useFloatingIcons } from '@/features/auth/welcome/useFloatingIcons';
import { WelcomeView } from '@/features/auth/welcome/components/presenters/WelcomeView';

type WelcomeOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'> & {
	backendUrlField: React.ReactNode;
};

export function WelcomeContainer({ navigation, backendUrlField }: WelcomeOrchestratorProps) {
	const icons = useFloatingIcons();
	const [showServer, setShowServer] = useState(false);

	return (
		<WelcomeView
			icons={icons}
			buildLabel={getBuildLabel()}
			showServer={showServer}
			onToggleServer={() => setShowServer(value => !value)}
			onStart={() => navigation.navigate('Register')}
			onLogin={() => navigation.navigate('Login')}
			onOpenPrivacyPolicy={() => navigation.navigate('PrivacyPolicy')}
			onOpenLink={url => openExternalUrl(url, () => showError(OPEN_LINK_FAILED))}
			backendUrlField={backendUrlField}
		/>
	);
}
