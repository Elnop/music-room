import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/contexts';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';

const { width } = Dimensions.get('window');

export function PlayerModal() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const { player, loading, error } = usePlayer();
  const { currentTrack, isPlaying, isModalOpen, setModalOpen, pause, resume } = usePlayerStore();

  // Track player progress in real-time
  const { currentTime, duration } = usePlayerProgress();

  // Synchronize player with store state
  usePlayerSync();

  if (!currentTrack) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (loading || !player) return;

    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSeek = (value: number) => {
    if (!player) return;
    player.seekTo(value);
  };

  const handleSkip = (seconds: number) => {
    if (!player) return;
    const newPosition = Math.max(0, Math.min(duration, currentTime + seconds));
    player.seekTo(newPosition);
  };

  const artworkUrl =
    currentTrack.artwork_url || currentTrack.user.avatar_url || 'https://via.placeholder.com/300';

  return (
    <Modal
      visible={isModalOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setModalOpen(false)}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setModalOpen(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIcon}>∨</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Image source={{ uri: artworkUrl }} style={styles.artwork} />
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.user.username}
          </Text>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Progress Slider */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
            disabled={loading || !player}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSkip(-10)}
            disabled={loading}
          >
            <Text style={styles.controlText}>-10s</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.background} />
            ) : (
              <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSkip(10)}
            disabled={loading}
          >
            <Text style={styles.controlText}>+10s</Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading stream...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    closeIcon: {
      fontSize: 24,
      color: theme.colors.text,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    artworkContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
    artwork: {
      width: width - theme.spacing.xxl * 2,
      height: width - theme.spacing.xxl * 2,
      borderRadius: theme.borders.medium,
      backgroundColor: theme.colors.surface,
    },
    trackInfo: {
      paddingHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    artist: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.xl,
      borderRadius: theme.borders.small,
      marginBottom: theme.spacing.md,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
    progressContainer: {
      paddingHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    timeText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
    controlButton: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borders.medium,
      minWidth: 60,
      alignItems: 'center',
    },
    controlText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.semibold,
    },
    playButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButtonText: {
      fontSize: 32,
      color: theme.colors.background,
    },
    loadingContainer: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });
