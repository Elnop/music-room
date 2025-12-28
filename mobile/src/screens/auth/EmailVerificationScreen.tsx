import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;

export default function EmailVerificationScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { verifyEmail, resendVerificationCode, isLoading, error } = useAuthStore();
  const { userId, email } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    if (text && !/^\d$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every((digit) => digit !== '') && text) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const finalCode = verificationCode || code.join('');

    if (finalCode.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    try {
      await verifyEmail(userId, finalCode);
      // Navigation handled by authStore (user will be logged in)
    } catch (err) {
      // Error already handled by authStore
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setIsResending(true);
    try {
      await resendVerificationCode(userId, email);
      setCooldown(60); // 60 second cooldown
      Alert.alert('Success', 'Verification code sent. Please check your email.');
    } catch (err) {
      // Error handled by authStore
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: colors.primary }}>{email}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                {
                  borderColor: digit ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                  color: colors.text,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <Text style={[styles.error, { color: colors.error }]}>
            {error}
          </Text>
        )}

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (isLoading || code.some((d) => !d)) && styles.buttonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={isLoading || code.some((d) => !d)}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background }]}>
              Verify Email
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
            Didn't receive the code?{' '}
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={isResending || cooldown > 0}
          >
            <Text
              style={[
                styles.resendLink,
                {
                  color:
                    isResending || cooldown > 0
                      ? colors.textSecondary
                      : colors.primary,
                },
              ]}
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : isResending
                  ? 'Sending...'
                  : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.backText, { color: colors.textSecondary }]}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
