import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { useFloatingIcons } from '@/features/auth/welcome/hooks/useFloatingIcons';
import { WelcomeView } from '@/features/auth/welcome/components/presenters/WelcomeView';

type WelcomeOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeOrchestrator({ navigation }: WelcomeOrchestratorProps) {
	const icons = useFloatingIcons();
	const [showServer, setShowServer] = useState(false);

	return (
		<WelcomeView
			icons={icons}
			showServer={showServer}
			onToggleServer={() => setShowServer(value => !value)}
			onStart={() => navigation.navigate('Register')}
			onLogin={() => navigation.navigate('Login')}
		/>
	);
}
