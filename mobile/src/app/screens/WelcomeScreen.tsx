import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/types';
import { WelcomeContainer } from '@/features/user/features/auth/features/welcome/components/WelcomeContainer';
import { BackendUrlFieldContainer } from '@/features/shell/components/orchestrators/BackendUrlFieldContainer';

type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen(props: WelcomeScreenProps) {
	return <WelcomeContainer {...props} backendUrlField={<BackendUrlFieldContainer />} />;
}
