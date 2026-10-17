import React, { useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { FormError } from '@components/common/FormError';
import { registerSchema, RegisterInput } from '@utils/validators';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@utils/toast';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Logo = require('@/assets/logo/logo.png');

type AuthStackParamList = {
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	EmailVerification: { userId: string; email: string };
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
	navigation: RegisterScreenNavigationProp;
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const insets = useSafeAreaInsets();
	const { register, loginWithGoogle, loginWithFacebook, isLoading, error, clearError } =
		useAuthStore();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			email: '',
			password: '',
			username: '',
		},
	});

	// Show error toast
	useEffect(() => {
		if (error) {
			showError(error);
			clearError();
		}
	}, [error, clearError]);

	const onSubmit = async (data: RegisterInput) => {
		try {
			const result = await register(data);

			if (result.requiresVerification && result.userId && result.email) {
				navigation.navigate('EmailVerification', {
					userId: result.userId,
					email: result.email,
				});
			}
		} catch (error) {
			console.error('[RegisterScreen] Register error:', error);
		}
	};

	const handleGoogleLogin = async () => {
		try {
			await loginWithGoogle();
		} catch (error) {
			console.error('[RegisterScreen] Google login error:', error);
		}
	};

	const handleFacebookLogin = async () => {
		try {
			await loginWithFacebook();
		} catch (error) {
			console.error('[RegisterScreen] Facebook login error:', error);
		}
	};

	return (
		<View style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardAvoid}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<ScrollView
					contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
					keyboardShouldPersistTaps="handled"
					bounces={false}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.content}>
						<View style={styles.header}>
							<Image source={Logo} style={styles.logo} resizeMode="contain" />
						</View>

						{error && <FormError message={error} />}

						<View style={styles.form}>
							<Controller
								control={control}
								name="email"
								render={({ field: { onChange, value } }) => (
									<Input
										label="Email"
										value={value}
										onChangeText={onChange}
										placeholder="vous@exemple.com"
										error={errors.email?.message}
										keyboardType="email-address"
										autoCapitalize="none"
									/>
								)}
							/>

							<Controller
								control={control}
								name="username"
								render={({ field: { onChange, value } }) => (
									<Input
										label="Nom d'utilisateur"
										value={value}
										onChangeText={onChange}
										placeholder="votre_pseudo"
										error={errors.username?.message}
										autoCapitalize="none"
									/>
								)}
							/>

							<Controller
								control={control}
								name="password"
								render={({ field: { onChange, value } }) => (
									<Input
										label="Mot de passe"
										value={value}
										onChangeText={onChange}
										placeholder="Choisissez un mot de passe robuste"
										error={errors.password?.message}
										secureTextEntry
										autoCapitalize="none"
									/>
								)}
							/>

							<View style={styles.passwordHint}>
								<Text style={styles.passwordHintText}>
									Le mot de passe doit contenir :{'\n'}• Au moins 8 caractères{'\n'}• Une majuscule
									{'\n'}• Un chiffre{'\n'}• Un caractère spécial
								</Text>
							</View>

							<Button
								title="Créer un compte"
								onPress={handleSubmit(onSubmit)}
								loading={isLoading}
								fullWidth
								variant="primary"
							/>

							{/* Divider */}
							<View style={styles.divider}>
								<View style={styles.dividerLine} />
								<Text style={styles.dividerText}>OU</Text>
								<View style={styles.dividerLine} />
							</View>

							{/* Google Sign-In Button */}
							<TouchableOpacity
								style={styles.googleButton}
								onPress={handleGoogleLogin}
								disabled={isLoading}
							>
								<Text style={styles.googleIcon}>G</Text>
								<Text style={styles.googleButtonText}>Continuer avec Google</Text>
							</TouchableOpacity>

							{/* Facebook Sign-In Button */}
							<TouchableOpacity
								style={styles.facebookButton}
								onPress={handleFacebookLogin}
								disabled={isLoading}
							>
								<Text style={styles.facebookIcon}>f</Text>
								<Text style={styles.facebookButtonText}>Continuer avec Facebook</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.footer}>
							<Text style={styles.footerText}>Déjà un compte ? </Text>
							<Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
								Se connecter
							</Text>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		keyboardAvoid: {
			flex: 1,
		},
		scrollContent: {
			flexGrow: 1,
		},
		content: {
			flex: 1,
			padding: theme.spacing.lg,
			justifyContent: 'center',
		},
		header: {
			alignItems: 'center',
			marginBottom: theme.spacing.xl,
		},
		logo: {
			width: 120,
			height: 120,
		},
		form: {
			gap: theme.spacing.md,
		},
		passwordHint: {
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.sm,
			borderRadius: 8,
			marginTop: -theme.spacing.xs,
		},
		passwordHintText: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			lineHeight: 16,
		},
		footer: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginTop: theme.spacing.xl,
		},
		footerText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		footerLink: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontWeight: theme.typography.weights.semibold,
		},
		divider: {
			flexDirection: 'row',
			alignItems: 'center',
			marginVertical: theme.spacing.lg,
		},
		dividerLine: {
			flex: 1,
			height: 1,
			backgroundColor: '#3E3E3E',
		},
		dividerText: {
			marginHorizontal: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		googleButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#FFFFFF',
			borderRadius: 8,
			paddingVertical: 12,
			borderWidth: 1,
			borderColor: '#DADCE0',
		},
		googleIcon: {
			fontSize: 20,
			fontWeight: 'bold',
			color: '#4285F4',
			marginRight: 12,
		},
		googleButtonText: {
			fontSize: 16,
			fontWeight: '500',
			color: '#3C4043',
		},
		facebookButton: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#1877F2',
			borderRadius: 8,
			paddingVertical: 12,
			borderWidth: 1,
			borderColor: '#1877F2',
		},
		facebookIcon: {
			fontSize: 20,
			fontWeight: 'bold',
			color: '#FFFFFF',
			marginRight: 12,
		},
		facebookButtonText: {
			fontSize: 16,
			fontWeight: '500',
			color: '#FFFFFF',
		},
	});
