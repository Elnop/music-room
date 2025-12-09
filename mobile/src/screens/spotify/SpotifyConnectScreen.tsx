import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useSpotifyStore } from '@/store/spotifyStore';
import { Button } from '@/components/common';

export function SpotifyConnectScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { initiateConnection, isConnecting, error, clearError } = useSpotifyStore();
  const [canSkip, setCanSkip] = useState(false);

  // Allow skip after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = async () => {
    try {
      clearError();
      await initiateConnection();
      // On success, navigate back to profile
      navigation.goBack();
    } catch (error) {
      Alert.alert('Connection Failed', 'Failed to connect to Spotify. Please try again.');
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Spotify Logo/Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎵</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Connect to Spotify</Text>
        <Text style={styles.subtitle}>
          Connect your Spotify account to search and add tracks to collaborative playlists.
        </Text>

        {/* Features List */}
        <View style={styles.features}>
          <FeatureItem text="Search the entire Spotify catalog" />
          <FeatureItem text="Add tracks to shared playlists" />
          <FeatureItem text="Sync with your Spotify library" />
          <FeatureItem text="Discover music with friends" />
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleConnect}
            loading={isConnecting}
            disabled={isConnecting}
            style={styles.button}
          >
            {isConnecting ? 'Connecting...' : 'Connect Spotify'}
          </Button>

          {canSkip && (
            <Button
              variant="ghost"
              onPress={handleSkip}
              disabled={isConnecting}
              style={styles.button}
            >
              Skip for now
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
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
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xxl,
      justifyContent: 'center',
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    icon: {
      fontSize: 80,
    },
    title: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: theme.spacing.xl,
    },
    features: {
      marginBottom: theme.spacing.xl,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    featureIcon: {
      fontSize: 20,
      color: theme.colors.primary,
      marginRight: theme.spacing.md,
    },
    featureText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      borderRadius: 8,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: 'center',
    },
    actions: {
      gap: theme.spacing.md,
    },
    button: {
      width: '100%',
    },
  });
