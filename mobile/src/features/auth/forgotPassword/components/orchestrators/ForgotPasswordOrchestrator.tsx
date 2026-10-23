import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { useForgotPassword } from '@/features/auth/forgotPassword/hooks/useForgotPassword';
import { ForgotPasswordView } from '@/features/auth/forgotPassword/components/presenters/ForgotPasswordView';

type ForgotPasswordOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

/** Prefilled with the login email. */
export function ForgotPasswordOrchestrator({ route, navigation }: ForgotPasswordOrchestratorProps) {
	const form = useForgotPassword(route.params?.email ?? '', navigation);
	return <ForgotPasswordView form={form} />;
}
