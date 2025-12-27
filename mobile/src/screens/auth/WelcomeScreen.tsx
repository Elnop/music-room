import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { Button } from '@components/common/Button';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.title}>Music Room</Text>
          <Text style={styles.subtitle}>Create collaborative playlists with friends</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            fullWidth
          />
          <Button
            title="Create Account"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            fullWidth
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Demo credentials:{'\n'}
            email: demo@musicroom.com{'\n'}
            password: Demo123!@#
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
    },
    header: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      fontSize: 72,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.xxxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    buttonContainer: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    footer: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    footerText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
