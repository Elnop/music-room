import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSpotifyStore } from '@/store/spotifyStore';
import { Button, Card, LoadingSpinner } from '@/components/common';
import { COLORS, SPACING } from '@/constants';

export function SpotifySettingsScreen() {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: SPACING.lg,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  connectedBadge: {
    backgroundColor: COLORS.primary + '20',
  },
  disconnectedBadge: {
    backgroundColor: COLORS.textSecondary + '20',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectedText: {
    color: COLORS.primary,
  },
  disconnectedText: {
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  scopesContainer: {
    paddingVertical: SPACING.md,
  },
  scopesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  infoSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  bulletPoint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: SPACING.lg,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});
