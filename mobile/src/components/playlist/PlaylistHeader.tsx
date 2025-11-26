import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Avatar } from '@components/common';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import type { PlaylistWithTracks } from '@types';

interface PlaylistHeaderProps {
  playlist: PlaylistWithTracks;
}

export function PlaylistHeader({ playlist }: PlaylistHeaderProps) {
  const defaultCover = 'https://via.placeholder.com/300/1DB954/FFFFFF?text=Playlist';
  const trackCount = playlist.tracks.length;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: playlist.coverUrl || defaultCover }}
        style={styles.cover}
      />
      <Text style={styles.name}>{playlist.name}</Text>
      {playlist.description && (
        <Text style={styles.description}>{playlist.description}</Text>
      )}
      <View style={styles.meta}>
        <Avatar uri={playlist.owner.avatarUrl} name={playlist.owner.displayName} size="sm" />
        <Text style={styles.owner}>{playlist.owner.displayName || playlist.owner.username}</Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.trackCount}>
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
        </Text>
      </View>
      {playlist.collaboratorIds.length > 0 && (
        <View style={styles.collaborators}>
          <Text style={styles.collaboratorsText}>
            {playlist.collaboratorIds.length} {playlist.collaboratorIds.length === 1 ? 'collaborator' : 'collaborators'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  cover: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  owner: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  separator: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
  },
  trackCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  collaborators: {
    marginTop: SPACING.sm,
  },
  collaboratorsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
});
