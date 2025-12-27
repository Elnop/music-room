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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';

const { width } = Dimensions.get('window');

export function PlayerModal() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const { player, error } = usePlayer();
  const { currentTrack, playbackState, isModalOpen, setModalOpen, pause, resume } =
    usePlayerStore();

  const { currentTime, duration } = usePlayerProgress();

  if (!currentTrack) {
    return null;
  }

  // Derive UI state from playbackState
  const isLoading = playbackState === 'loading';
  const isPlaying = playbackState === 'playing';
  const canInteract = playbackState === 'playing' || playbackState === 'paused';

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!canInteract || !player) return;

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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setModalOpen(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.artworkContainer}>
          <Image source={{ uri: artworkUrl }} style={styles.artwork} />
        </View>

        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.user.username}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

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
            disabled={isLoading || !player}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSkip(-10)}
            disabled={isLoading || !canInteract}
          >
            <Ionicons name="play-back" size={24} color={theme.colors.text} />
            <Text style={styles.controlText}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={36}
                color="#FFFFFF"
                style={isPlaying ? undefined : { marginLeft: 4 }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSkip(10)}
            disabled={isLoading || !canInteract}
          >
            <Ionicons name="play-forward" size={24} color={theme.colors.text} />
            <Text style={styles.controlText}>10s</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading stream...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
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
      borderRadius: 16,
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
      borderRadius: 12,
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
      borderRadius: 16,
      minWidth: 70,
      alignItems: 'center',
    },
    controlText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    playButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
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
