import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { useResetPassword } from '@/features/user/features/auth/features/reset-password/hooks/useResetPassword';
import { ResetPasswordView } from '@/features/user/features/auth/features/reset-password/components/presenters/ResetPasswordView';

type ResetPasswordOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordContainer({ route, navigation }: ResetPasswordOrchestratorProps) {
	const { email } = route.params;
	const form = useResetPassword(email, navigation);
	return <ResetPasswordView email={email} form={form} />;
}
