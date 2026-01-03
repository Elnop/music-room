import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '@screens/auth/WelcomeScreen';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { RegisterScreen } from '@screens/auth/RegisterScreen';
import { EmailVerificationScreen } from '@screens/auth/EmailVerificationScreen';
import { ForgotPasswordScreen } from '@screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@screens/auth/ResetPasswordScreen';
import { useTheme } from '@/contexts/ThemeContext';

export type AuthStackParamList = {
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	EmailVerification: { userId: string; email: string };
	ForgotPassword: undefined;
	ResetPassword: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
	const { theme } = useTheme();

	return (
		<Stack.Navigator
			screenOptions={{
				// Header opaque avec effet blur natif sur iOS
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
				// Pas de titre dans le header (on a le logo)
				headerTitle: '',
			}}
		>
			<Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Register" component={RegisterScreen} />
			<Stack.Screen
				name="EmailVerification"
				component={EmailVerificationScreen}
				options={{ title: 'Verify Email' }}
			/>
			<Stack.Screen
				name="ForgotPassword"
				component={ForgotPasswordScreen}
				options={{ title: 'Forgot Password' }}
			/>
			<Stack.Screen
				name="ResetPassword"
				component={ResetPasswordScreen}
				options={{ title: 'Reset Password' }}
			/>
		</Stack.Navigator>
	);
}
