import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { useForgotPassword } from '@/features/auth/forgotPassword/useForgotPassword';
import { ForgotPasswordView } from './ForgotPasswordView';

type ForgotPasswordOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordContainer({ route, navigation }: ForgotPasswordOrchestratorProps) {
	const form = useForgotPassword(route.params?.email ?? '', navigation);
	return <ForgotPasswordView form={form} />;
}
