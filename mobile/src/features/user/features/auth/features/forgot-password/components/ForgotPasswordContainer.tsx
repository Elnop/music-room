import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { useForgotPassword } from '@/features/user/features/auth/features/forgot-password/hooks/useForgotPassword';
import { ForgotPasswordView } from '@/features/user/features/auth/features/forgot-password/components/presenters/ForgotPasswordView';

type ForgotPasswordOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordContainer({ route, navigation }: ForgotPasswordOrchestratorProps) {
	const form = useForgotPassword(route.params?.email ?? '', navigation);
	return <ForgotPasswordView form={form} />;
}
