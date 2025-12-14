import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts';
import { usePlayerStore } from '@/store/playerStore';
import { useSoundCloudPlayer } from '@/hooks/useSoundCloudPlayer';

export function MiniPlayer() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);

  const { currentTrack, isPlaying, pause, resume, toggleModal } = usePlayerStore();
  const { player, loading } = useSoundCloudPlayer(currentTrack);

  // Don't render if no track
  if (!currentTrack) {
    return null;
  }

  const artworkUrl = currentTrack.artwork_url || currentTrack.user.avatar_url || 'https://via.placeholder.com/40';

  const handlePlayPause = () => {
    if (loading) return;

    if (isPlaying) {
      player.pause();
      pause();
    } else {
      player.play();
      resume();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={toggleModal}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <Image
          source={{ uri: artworkUrl }}
          style={styles.artwork}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.user.username}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Simple progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: player.duration > 0
                ? `${(player.currentTime / player.duration) * 100}%`
                : '0%',
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 60 + insets.bottom, // Tab bar height (60px) + bottom safe area
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    artwork: {
      width: 40,
      height: 40,
      borderRadius: theme.borders.small,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.background,
    },
    info: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    title: {
      fontSize: 14,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    artist: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    playButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButtonText: {
      fontSize: 16,
      color: theme.colors.background,
    },
    progressBarContainer: {
      height: 2,
      backgroundColor: theme.colors.border,
    },
    progressBar: {
      height: 2,
      backgroundColor: theme.colors.primary,
    },
  });
