import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { EmptyState } from '@components/common';
import type { Playlist, SpotifyTrack } from '@types';

interface PlaylistSelectorModalProps {
  visible: boolean;
  playlists: Playlist[];
  selectedTrack: SpotifyTrack | null;
  onSelectPlaylist: (playlistId: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function PlaylistSelectorModal({
  visible,
  playlists,
  selectedTrack,
  onSelectPlaylist,
  onClose,
  isLoading = false,
}: PlaylistSelectorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.container}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add to Playlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Track Preview */}
          {selectedTrack && (
            <View style={styles.trackPreview}>
              <Image
                source={{ uri: selectedTrack.album.images[0]?.url }}
                style={styles.trackAlbumArt}
              />
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {selectedTrack.name}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {selectedTrack.artists.map(a => a.name).join(', ')}
                </Text>
              </View>
            </View>
          )}

          {/* Playlists List */}
          <FlatList
            data={playlists}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playlistItem}
                onPress={() => onSelectPlaylist(item.id)}
                disabled={isLoading}
              >
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{item.name}</Text>
                  <Text style={styles.playlistTracks}>
                    {item.trackIds.length} {item.trackIds.length === 1 ? 'track' : 'tracks'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="🎵"
                message="No playlists yet. Create one first!"
              />
            }
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeIcon: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  trackPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 8,
  },
  trackAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  trackInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  trackTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    flexGrow: 1,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  playlistTracks: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
});
