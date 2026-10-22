import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { useResetPassword } from '@/features/auth/resetPassword/hooks/useResetPassword';
import { ResetPasswordView } from '@/features/auth/resetPassword/components/presenters/ResetPasswordView';

type ResetPasswordOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

/** The new password screen, reached with the email the code was sent to. */
export function ResetPasswordOrchestrator({ route, navigation }: ResetPasswordOrchestratorProps) {
	const { email } = route.params;
	const form = useResetPassword(email, navigation);
	return <ResetPasswordView email={email} form={form} />;
}
