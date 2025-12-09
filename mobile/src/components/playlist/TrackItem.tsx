import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { formatDuration } from '@utils/formatters';
import type { Track } from '@types';

interface TrackItemProps {
  track: Track;
  onPress?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function TrackItem({ track, onPress, onDelete, showDelete = false }: TrackItemProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Image source={{ uri: track.albumArt }} style={styles.albumArt} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
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
      backgroundColor: theme.colors.surface, // Blanc
      borderWidth: theme.borders.medium, // 2px bordure
      borderColor: theme.colors.border, // Noir
      borderRadius: theme.borders.small, // 4px
      marginBottom: theme.spacing.sm,
      ...theme.shadows.small, // Ombre small
    },
    albumArt: {
      width: 48,
      height: 48,
      borderRadius: theme.borders.small, // 4px
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
      fontWeight: theme.typography.weights.medium, // 500
      color: theme.colors.text,
      marginBottom: 2,
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
