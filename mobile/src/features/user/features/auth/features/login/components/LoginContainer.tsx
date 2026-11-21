import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { useLoginForm } from '@/features/user/features/auth/features/login/hooks/useLoginForm';
import { useSocialSignIn } from '@/features/user/features/auth/shared/sign-in/hooks/useSocialSignIn';
import { LoginView } from '@/features/user/features/auth/features/login/components/presenters/LoginView';

type LoginOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginContainer({ navigation }: LoginOrchestratorProps) {
	const form = useLoginForm(navigation);
	const social = useSocialSignIn(form.reportError);

	return <LoginView form={form} social={social} />;
}
