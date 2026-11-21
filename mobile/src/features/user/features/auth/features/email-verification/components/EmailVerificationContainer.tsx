import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/types';
import { useEmailVerification } from '@/features/user/features/auth/features/email-verification/useEmailVerification';
import { EmailVerificationView } from '@/features/user/features/auth/features/email-verification/components/EmailVerificationView';

type EmailVerificationOrchestratorProps = NativeStackScreenProps<
	AuthStackParamList,
	'EmailVerification'
>;

export function EmailVerificationContainer({
	route,
	navigation,
}: EmailVerificationOrchestratorProps) {
	const { userId, email } = route.params;
	const verification = useEmailVerification(userId, email);

	return (
		<EmailVerificationView
			email={email}
			verification={verification}
			onBackToLogin={() => navigation.navigate('Login')}
		/>
	);
}
