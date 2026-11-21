import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showError } from '@/shared/theme/lib/toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/types';
import { useRegisterForm } from '@/features/user/features/auth/features/register/useRegisterForm';
import { useProviderSignIn } from '@/features/user/features/auth/shared/sign-in/hooks/useProviderSignIn';
import { useProviderButtons } from '@/features/user/features/auth/shared/sign-in/hooks/useProviderButtons';
import { RegisterView } from '@/features/user/features/auth/features/register/components/RegisterView';

type RegisterOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterContainer({ navigation }: RegisterOrchestratorProps) {
	const form = useRegisterForm(navigation);
	const provider = useProviderSignIn(showError);
	const googleButton = useProviderButtons(() => provider.signIn('google'), 'form');
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
			googleButton={googleButton}
		/>
	);
}
