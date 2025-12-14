import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/contexts';
import type { SoundCloudTrack } from '@/types';

interface Props {
  track: SoundCloudTrack;
  onPlay: (track: SoundCloudTrack) => void;
  onAddToPlaylist: (track: SoundCloudTrack) => void;
}

export function SoundCloudTrackItem({ track, onPlay, onAddToPlaylist }: Props) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const artworkUrl = track.artwork_url || track.user.avatar_url || 'https://via.placeholder.com/50';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onPlay(track)} style={styles.mainContent}>
        <Image
          source={{ uri: artworkUrl }}
          style={styles.artwork}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.user.username}
          </Text>
          <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => onPlay(track)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.playButtonText}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddToPlaylist(track)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    mainContent: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    artwork: {
      width: 50,
      height: 50,
      borderRadius: theme.borders.small,
      marginRight: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    artist: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    duration: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButtonText: {
      fontSize: 14,
      color: theme.colors.background,
      marginLeft: 2, // Visual center adjustment for play icon
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.bold,
    },
  });
