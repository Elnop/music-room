import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { useEmailVerification } from '@/features/auth/emailVerification/hooks/useEmailVerification';
import { EmailVerificationView } from '@/features/auth/emailVerification/components/presenters/EmailVerificationView';

type EmailVerificationOrchestratorProps = NativeStackScreenProps<
	AuthStackParamList,
	'EmailVerification'
>;

/** The code screen after a registration. */
export function EmailVerificationOrchestrator({
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
