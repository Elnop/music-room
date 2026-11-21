import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showError } from '@/shared/theme/lib/toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { useRegisterForm } from '@/features/user/features/auth/features/register/useRegisterForm';
import { useSocialSignIn } from '@/features/user/features/auth/shared/sign-in/hooks/useSocialSignIn';
import { RegisterView } from '@/features/user/features/auth/features/register/components/presenters/RegisterView';

type RegisterOrchestratorProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterContainer({ navigation }: RegisterOrchestratorProps) {
	const form = useRegisterForm(navigation);
	const social = useSocialSignIn(showError);
	const insets = useSafeAreaInsets();

	return <RegisterView form={form} social={social} bottomInset={insets.bottom} />;
}
