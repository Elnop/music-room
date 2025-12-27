import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { formatDuration } from '@utils/formatters';
import type { Track } from '@/types/track.types';

interface TrackItemProps {
  track: Track;
  onPlay?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
}

export function TrackItem({
  track,
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
      style={styles.container}
      onPress={onPlay}
      activeOpacity={0.6}
      disabled={!onPlay}
    >
      {/* Album artwork with loading indicator overlay */}
      <View style={styles.artworkContainer}>
        <Image source={{ uri: track.albumArt }} style={styles.albumArt} />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </View>
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
          onPress={e => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={theme.colors.error} />
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
      paddingVertical: 8,
      paddingHorizontal: theme.spacing.md,
    },
    artworkContainer: {
      width: 48,
      height: 48,
      borderRadius: 4,
      overflow: 'hidden',
    },
    albumArt: {
      width: 48,
      height: 48,
      backgroundColor: theme.colors.surfaceAlt,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
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
  });
