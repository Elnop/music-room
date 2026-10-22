import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showError } from '@/shared/utils/toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { useRegisterForm } from '@/features/auth/register/hooks/useRegisterForm';
import { useProviderSignIn } from '@/features/auth/social/hooks/useProviderSignIn';
import { RegisterView } from '@/features/auth/register/components/presenters/RegisterView';

type RegisterOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

/** The Register screen. */
export function RegisterOrchestrator({ navigation }: RegisterOrchestratorProps) {
	const form = useRegisterForm(navigation);
	const provider = useProviderSignIn(showError);
	const insets = useSafeAreaInsets();

	return (
		<RegisterView
			email={form.email}
			username={form.username}
			password={form.password}
			isLoading={form.isSubmitting || provider.isPending}
			bottomInset={insets.bottom}
			onSubmit={form.submit}
			onLogin={form.goToLogin}
			onGoogle={() => provider.signIn('google')}
			onFacebook={() => provider.signIn('facebook')}
		/>
	);
}
