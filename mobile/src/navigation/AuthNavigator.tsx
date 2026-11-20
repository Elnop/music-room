import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { WelcomeContainer } from '@/features/auth/welcome/components/WelcomeContainer';
import { LoginContainer } from '@/features/auth/login/components/LoginContainer';
import { RegisterContainer } from '@/features/auth/register/components/RegisterContainer';
import { EmailVerificationContainer } from '@/features/auth/emailVerification/components/EmailVerificationContainer';
import { ForgotPasswordContainer } from '@/features/auth/forgotPassword/components/ForgotPasswordContainer';
import { ResetPasswordContainer } from '@/features/auth/resetPassword/components/ResetPasswordContainer';
import { PrivacyPolicyContainer } from '@/features/legal/privacyPolicy/components/PrivacyPolicyContainer';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/pixelFrame';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const layout = screenLayout(false);

export function AuthNavigator() {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();

	return (
		<Stack.Navigator
			screenLayout={layout}
			screenOptions={{
				...(isWide ? { header: screenHeader } : null),
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
				headerTintColor: theme.colors.text,
				headerShadowVisible: false,
				headerTitleStyle: headerTitle(theme),
				headerTitleAlign: 'center',
				// No title: the screens show the logo.
				headerTitle: '',
			}}
		>
			<Stack.Screen
				name="Welcome"
				component={WelcomeContainer}
				options={{ title: 'Bienvenue', headerShown: false }}
			/>
			<Stack.Screen name="Login" component={LoginContainer} options={{ title: 'Connexion' }} />
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
			<Stack.Screen
				name="PrivacyPolicy"
				component={PrivacyPolicyContainer}
				options={{
					title: 'Politique de confidentialité',
					headerTitle: 'Politique de confidentialité',
				}}
			/>
		</Stack.Navigator>
	);
}
