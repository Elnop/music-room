import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/auth/types';
import { WelcomeOrchestrator } from '@/features/auth/welcome/components/orchestrators/WelcomeOrchestrator';
import { LoginOrchestrator } from '@/features/auth/login/components/orchestrators/LoginOrchestrator';
import { RegisterOrchestrator } from '@/features/auth/register/components/orchestrators/RegisterOrchestrator';
import { EmailVerificationOrchestrator } from '@/features/auth/emailVerification/components/orchestrators/EmailVerificationOrchestrator';
import { ForgotPasswordOrchestrator } from '@/features/auth/forgotPassword/components/orchestrators/ForgotPasswordOrchestrator';
import { ResetPasswordOrchestrator } from '@/features/auth/resetPassword/components/orchestrators/ResetPasswordOrchestrator';
import { useTheme } from '@/shared/theme/ThemeContext';
import { screenLayout } from '@/navigation/screenLayout';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const layout = screenLayout(false);

export function AuthNavigator() {
	const { theme } = useTheme();

	return (
		<Stack.Navigator
			screenLayout={layout}
			screenOptions={{
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
				headerTintColor: theme.colors.text,
				headerShadowVisible: false,
				headerTitleStyle: {
					fontWeight: theme.typography.weights.bold,
				},
				headerTitleAlign: 'center',
				// No title: the screens show the logo
				headerTitle: '',
			}}
		>
			<Stack.Screen
				name="Welcome"
				component={WelcomeOrchestrator}
				options={{ headerShown: false }}
			/>
			<Stack.Screen name="Login" component={LoginOrchestrator} />
			<Stack.Screen name="Register" component={RegisterOrchestrator} />
			<Stack.Screen
				name="EmailVerification"
				component={EmailVerificationOrchestrator}
				options={{ title: "Vérification de l'email" }}
			/>
			<Stack.Screen
				name="ForgotPassword"
				component={ForgotPasswordOrchestrator}
				options={{ title: 'Mot de passe oublié' }}
			/>
			<Stack.Screen
				name="ResetPassword"
				component={ResetPasswordOrchestrator}
				options={{ title: 'Nouveau mot de passe' }}
			/>
		</Stack.Navigator>
	);
}
