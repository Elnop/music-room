import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import type { ListeningStatus } from '@/hooks/useMusicControl';

interface DeviceListeningCardProps {
  status: ListeningStatus;
  onPlay: () => void;
  onPause: () => void;
}

/**
 * Card component to display a device's listening status
 * Shows device name, current track info, and play/pause controls
 */
export function DeviceListeningCard({ status, onPlay, onPause }: DeviceListeningCardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const getDeviceIcon = () => {
    switch (status.device.platform) {
      case 'ios':
        return '📱';
      case 'android':
        return '📲';
      default:
        return '💻';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.deviceHeader}>
        <Text style={styles.deviceIcon}>{getDeviceIcon()}</Text>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {status.device.deviceName}
          </Text>
          <Text style={styles.deviceModel} numberOfLines={1}>
            {status.device.model}
          </Text>
        </View>
        <View style={[styles.statusDot, status.isPlaying && styles.statusDotPlaying]} />
      </View>

      {status.track ? (
        <View style={styles.trackContainer}>
          <Image
            source={{ uri: status.track.artworkUrl || 'https://via.placeholder.com/50' }}
            style={styles.trackArtwork}
          />
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {status.track.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {status.track.artist}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.controlButton, status.isPlaying && styles.controlButtonActive]}
            onPress={status.isPlaying ? onPause : onPlay}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.controlIcon}>{status.isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune musique en cours</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borders.medium,
      borderWidth: theme.borders.thin,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    deviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: theme.spacing.sm,
    },
    deviceIcon: {
      fontSize: 24,
      marginRight: theme.spacing.sm,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    deviceModel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.textSecondary,
    },
    statusDotPlaying: {
      backgroundColor: theme.colors.success,
    },
    trackContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trackArtwork: {
      width: 50,
      height: 50,
      borderRadius: theme.borders.small,
      backgroundColor: theme.colors.surfaceAlt,
      marginRight: theme.spacing.md,
    },
    trackInfo: {
      flex: 1,
    },
    trackTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    trackArtist: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    controlButton: {
      backgroundColor: theme.colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.md,
    },
    controlButtonActive: {
      backgroundColor: theme.colors.secondary || theme.colors.primary,
    },
    controlIcon: {
      fontSize: 18,
      color: theme.colors.background,
    },
    emptyContainer: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });
