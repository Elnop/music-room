import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useSpotifyStore } from '@/store/spotifyStore';
import { Button, Card, LoadingSpinner } from '@/components/common';

export function SpotifySettingsScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { connectionStatus, isLoading, checkStatus, disconnect } = useSpotifyStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnect();
              Alert.alert('Success', 'Spotify account disconnected');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect Spotify');
            }
          },
        },
      ]
    );
  };

  if (isLoading && !connectionStatus) {
    return <LoadingSpinner fullScreen message="Loading Spotify settings..." />;
  }

  const isConnected = connectionStatus?.connected || false;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Connection Status Card */}
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.badge, isConnected ? styles.connectedBadge : styles.disconnectedBadge]}>
              <Text style={[styles.badgeText, isConnected ? styles.connectedText : styles.disconnectedText]}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>

          {isConnected && connectionStatus?.spotifyUserId && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.label}>Spotify User ID</Text>
                <Text style={styles.value}>{connectionStatus.spotifyUserId}</Text>
              </View>
            </>
          )}

          {isConnected && connectionStatus?.scopes && (
            <>
              <View style={styles.divider} />
              <View style={styles.scopesContainer}>
                <Text style={styles.label}>Permissions</Text>
                <Text style={styles.scopesText}>{connectionStatus.scopes.length} scopes granted</Text>
              </View>
            </>
          )}
        </Card>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Spotify Integration</Text>
          <Text style={styles.infoText}>
            Connecting your Spotify account allows you to:
          </Text>
          <Text style={styles.bulletPoint}>• Search the full Spotify catalog</Text>
          <Text style={styles.bulletPoint}>• Add tracks to collaborative playlists</Text>
          <Text style={styles.bulletPoint}>• Sync with your Spotify library</Text>
          <Text style={styles.bulletPoint}>• Share music with friends in real-time</Text>
        </View>

        {/* Actions */}
        {isConnected && (
          <View style={styles.actions}>
            <Button
              variant="outline"
              onPress={handleDisconnect}
              loading={isLoading}
              style={styles.button}
            >
              Disconnect Spotify
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingVertical: theme.spacing.lg,
    },
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    label: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
    },
    badge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: 12,
    },
    connectedBadge: {
      backgroundColor: theme.colors.primary + '20',
    },
    disconnectedBadge: {
      backgroundColor: theme.colors.textSecondary + '20',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: theme.typography.weights.semibold,
    },
    connectedText: {
      color: theme.colors.primary,
    },
    disconnectedText: {
      color: theme.colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    scopesContainer: {
      paddingVertical: theme.spacing.md,
    },
    scopesText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    infoSection: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: theme.spacing.sm,
    },
    bulletPoint: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    actions: {
      paddingHorizontal: theme.spacing.lg,
    },
    button: {
      marginBottom: theme.spacing.sm,
    },
  });
