import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts';
import { usePlaylistStore } from '@/store/playlistStore';
import type { SoundCloudTrack } from '@/types';

interface Props {
  visible: boolean;
  track: SoundCloudTrack | null;
  onClose: () => void;
}

export function PlaylistSelectorModal({ visible, track, onClose }: Props) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { playlists, addTrack } = usePlaylistStore();

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!track) return;

    try {
      // Convert SoundCloud track to internal format
      const internalTrack = {
        title: track.title,
        artist: track.user.username,
        album: track.genre || 'SoundCloud',
        albumArt: track.artwork_url || track.user.avatar_url || '',
        durationMs: track.duration,
        trackUri: track.permalink_url,
        previewUrl: '', // Stream URL fetched separately
      };

      await addTrack(playlistId, internalTrack);

      Alert.alert(
        'Success',
        `Added "${track.title}" to playlist`,
        [{ text: 'OK' }]
      );

      onClose();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add track to playlist',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Playlist</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {track && (
            <View style={styles.trackPreview}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.user.username}
              </Text>
            </View>
          )}

          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playlistItem}
                onPress={() => handleSelectPlaylist(item.id)}
              >
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{item.name}</Text>
                  <Text style={styles.playlistTrackCount}>
                    {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No playlists available</Text>
                <Text style={styles.emptySubtext}>Create a playlist first</Text>
              </View>
            }
            style={styles.list}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borders.medium,
      borderTopRightRadius: theme.borders.medium,
      paddingTop: theme.spacing.lg,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    closeIcon: {
      fontSize: 24,
      color: theme.colors.textSecondary,
    },
    trackPreview: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.borders.medium,
      marginBottom: theme.spacing.md,
    },
    trackTitle: {
      fontSize: 16,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    trackArtist: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    list: {
      maxHeight: 400,
    },
    playlistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    playlistInfo: {
      flex: 1,
    },
    playlistName: {
      fontSize: 16,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    playlistTrackCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    chevron: {
      fontSize: 24,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    cancelButton: {
      margin: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borders.medium,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.semibold,
    },
  });
