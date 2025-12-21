import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { formatDuration } from '@utils/formatters';
import type { Track } from '@types';

interface TrackItemProps {
  track: Track;
  onPress?: () => void;
  onPlay?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
}

export function TrackItem({
  track,
  onPress,
  onPlay,
  onDelete,
  showDelete = false,
  isPlaying = false,
  isLoading = false,
}: TrackItemProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.containerPlaying]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Play button */}
      {onPlay && (
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={onPlay}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          )}
        </TouchableOpacity>
      )}
      <Image source={{ uri: track.albumArt }} style={styles.albumArt} />
      <View style={styles.info}>
        <Text style={[styles.title, isPlaying && styles.titlePlaying]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      <Text style={styles.duration}>{formatDuration(track.durationMs)}</Text>
      {showDelete && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
      borderRadius: theme.borders.small,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.small,
    },
    containerPlaying: {
      backgroundColor: theme.colors.primaryLight || theme.colors.surfaceAlt,
      borderColor: theme.colors.primary,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    playButtonActive: {
      backgroundColor: theme.colors.secondary || theme.colors.primary,
    },
    playIcon: {
      fontSize: 14,
      color: theme.colors.background,
    },
    albumArt: {
      width: 48,
      height: 48,
      borderRadius: theme.borders.small,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: theme.borders.thin,
      borderColor: theme.colors.border,
    },
    info: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginBottom: 2,
    },
    titlePlaying: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.bold,
    },
    artist: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    duration: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
    },
    deleteButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteIcon: {
      fontSize: 20,
      color: theme.colors.error,
      fontWeight: theme.typography.weights.bold,
    },
  });
