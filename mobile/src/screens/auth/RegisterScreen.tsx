import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { FormError } from '@components/common/FormError';
import { registerSchema, RegisterInput } from '@utils/validators';
import { useAuthStore } from '@/store/authStore';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const onSubmit = async (data: RegisterInput) => {
    try {
      await register(data);
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      console.error('[RegisterScreen] Register error:', error);
      // Error shown via alert (from auth store)
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      console.error('[RegisterScreen] Google login error:', error);
      // Error shown via alert (from auth store)
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      console.error('[RegisterScreen] Facebook login error:', error);
      // Error shown via alert (from auth store)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Rejoins Zumik</Text>
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
                    placeholder="you@example.com"
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
                    label="Username"
                    value={value}
                    onChangeText={onChange}
                    placeholder="your_username"
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
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Create a strong password"
                    error={errors.password?.message}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                )}
              />

              <View style={styles.passwordHint}>
                <Text style={styles.passwordHintText}>
                  Password must contain:{'\n'}• At least 8 characters{'\n'}• One uppercase letter
                  {'\n'}• One number{'\n'}• One special character
                </Text>
              </View>

              <Button
                title="Create Account"
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
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
                Sign in
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
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
