import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { formatDuration } from '@utils/formatters';
import type { SpotifyTrack } from '@types';

interface SpotifyTrackItemProps {
  track: SpotifyTrack;
  onAdd: (track: SpotifyTrack) => void;
  isAdding?: boolean;
}

export function SpotifyTrackItem({ track, onAdd, isAdding = false }: SpotifyTrackItemProps) {
  const albumArtUrl = track.album.images[0]?.url || '';
  const artistNames = track.artists.map(a => a.name).join(', ');

  return (
    <View style={styles.container}>
      <Image source={{ uri: albumArtUrl }} style={styles.albumArt} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artistNames}
        </Text>
      </View>
      <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>
      <TouchableOpacity
        style={[styles.addButton, isAdding && styles.addButtonDisabled]}
        onPress={() => onAdd(track)}
        disabled={isAdding}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <Text style={styles.addButtonText}>Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  albumArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  artist: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  duration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
});
