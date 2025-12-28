import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { FormError } from '@components/common/FormError';
import { loginSchema, LoginInput } from '@utils/validators';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@services/api';
import { RouteProp } from '@react-navigation/native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Logo = require('@/assets/logo/logo.png');

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: { userId: string; email: string };
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { login, loginWithGoogle, loginWithFacebook, isLoading, error, clearError } =
    useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isFocused = useIsFocused();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Show error alert only when screen is focused and mounted
  useEffect(() => {
    if (error && isFocused && isMounted.current) {
      // Small delay to ensure Activity is attached
      const timer = setTimeout(() => {
        if (isMounted.current && isFocused) {
          Alert.alert('Login Failed', error, [{ text: 'OK', onPress: clearError }]);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [error, clearError, isFocused]);

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password);
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);

      // Check if error is EMAIL_NOT_VERIFIED
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        const details = error.details as { userId?: string; email?: string } | undefined;

        if (details?.userId && details?.email) {
          // Show alert with option to resend verification code
          Alert.alert(
            'Email Not Verified',
            'Your email address has not been verified yet. Would you like to receive a new verification code?',
            [
              { text: 'Cancel', style: 'cancel', onPress: clearError },
              {
                text: 'Resend Code',
                onPress: () => {
                  clearError();
                  navigation.navigate('EmailVerification', {
                    userId: details.userId!,
                    email: details.email!,
                  });
                },
              },
            ]
          );
          return;
        }
      }

      // Error shown via alert (from auth store)
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      console.error('[LoginScreen] Google login error:', error);
      // Error shown via alert (from auth store)
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      console.error('[LoginScreen] Facebook login error:', error);
      // Error shown via alert (from auth store)
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
                    placeholder="demo@musicroom.com"
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                )}
              />

              <Button
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                variant="primary"
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Facebook Sign-In Button */}
              <TouchableOpacity
                style={styles.facebookButton}
                onPress={handleFacebookLogin}
                disabled={isLoading}
              >
                <Text style={styles.facebookIcon}>f</Text>
                <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
                Sign up
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
      width: 150,
      height: 150,
    },
    form: {
      gap: theme.spacing.md,
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
