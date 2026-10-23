import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { useLoginForm } from '@/features/auth/login/hooks/useLoginForm';
import { useProviderSignIn } from '@/features/auth/social/hooks/useProviderSignIn';
import { LoginView } from '@/features/auth/login/components/presenters/LoginView';

type LoginOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginOrchestrator({ navigation }: LoginOrchestratorProps) {
	const form = useLoginForm(navigation);
	const provider = useProviderSignIn(form.reportError);

	return (
		<LoginView
			email={form.email}
			password={form.password}
			isLoading={form.isSubmitting || provider.isPending}
			onSubmit={form.submit}
			onForgotPassword={form.goToForgotPassword}
			onRegister={form.goToRegister}
			onGoogle={() => provider.signIn('google')}
			onFacebook={() => provider.signIn('facebook')}
		/>
	);
}
