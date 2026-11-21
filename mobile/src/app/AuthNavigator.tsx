import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { WelcomeScreen } from '@/app/screens/WelcomeScreen';
import { LoginContainer } from '@/features/user/features/auth/features/login/components/LoginContainer';
import { RegisterContainer } from '@/features/user/features/auth/features/register/components/RegisterContainer';
import { EmailVerificationContainer } from '@/features/user/features/auth/features/email-verification/components/EmailVerificationContainer';
import { ForgotPasswordContainer } from '@/features/user/features/auth/features/forgot-password/components/ForgotPasswordContainer';
import { ResetPasswordContainer } from '@/features/user/features/auth/features/reset-password/components/ResetPasswordContainer';
import { PrivacyPolicyContainer } from '@/features/legal/components/PrivacyPolicyContainer';
import { screenLayout } from '@/features/shell/screenLayout';
import { useStackOptions } from '@/features/shell/hooks/useStackOptions';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const layout = screenLayout(false);

const PRIVACY_POLICY_OPTIONS = {
	title: 'Politique de confidentialité',
	headerTitle: 'Politique de confidentialité',
};

function signUpScreens() {
	return (
		<>
			<Stack.Screen
				name="Register"
				component={RegisterContainer}
				options={{ title: 'Inscription' }}
			/>
			<Stack.Screen
				name="EmailVerification"
				component={EmailVerificationContainer}
				options={{ title: "Vérification de l'email" }}
			/>
		</>
	);
}

function passwordRecoveryScreens() {
	return (
		<>
			<Stack.Screen
				name="ForgotPassword"
				component={ForgotPasswordContainer}
				options={{ title: 'Mot de passe oublié' }}
			/>
			<Stack.Screen
				name="ResetPassword"
				component={ResetPasswordContainer}
				options={{ title: 'Nouveau mot de passe' }}
			/>
		</>
	);
}

export function AuthNavigator() {
	const stackOptions = useStackOptions();

	return (
		<Stack.Navigator screenLayout={layout} screenOptions={{ ...stackOptions, headerTitle: '' }}>
			<Stack.Screen
				name="Welcome"
				component={WelcomeScreen}
				options={{ title: 'Bienvenue', headerShown: false }}
			/>
			<Stack.Screen name="Login" component={LoginContainer} options={{ title: 'Connexion' }} />
			{signUpScreens()}
			{passwordRecoveryScreens()}
			<Stack.Screen
				name="PrivacyPolicy"
				component={PrivacyPolicyContainer}
				options={PRIVACY_POLICY_OPTIONS}
			/>
		</Stack.Navigator>
	);
}
