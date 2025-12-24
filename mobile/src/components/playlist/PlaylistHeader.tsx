import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Avatar } from '@components/common/Avatar';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import type { PlaylistWithTracks } from '@types';

interface PlaylistHeaderProps {
  playlist: PlaylistWithTracks;
}

export function PlaylistHeader({ playlist }: PlaylistHeaderProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const firstTrackCover = playlist.tracks[0]?.albumArt;
  const coverUrl = playlist.coverUrl || firstTrackCover;
  const trackCount = playlist.tracks.length;

  return (
    <View style={styles.container}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.emptyCover]}>
          <Text style={styles.emptyIcon}>🎵</Text>
        </View>
      )}
      <Text style={styles.name}>{playlist.name}</Text>
      {playlist.description && <Text style={styles.description}>{playlist.description}</Text>}
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
            {playlist.collaboratorIds.length}{' '}
            {playlist.collaboratorIds.length === 1 ? 'collaborator' : 'collaborators'}
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface, // Blanc
      borderBottomWidth: theme.borders.thick, // 3px bordure bottom
      borderBottomColor: theme.colors.border, // Noir
      ...theme.shadows.medium, // Ombre
    },
    cover: {
      width: 200,
      height: 200,
      borderRadius: theme.borders.medium,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: theme.borders.thick,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    emptyCover: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 64,
    },
    name: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold, // 700 - bold
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    description: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      fontWeight: theme.typography.weights.regular,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    owner: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium,
      marginLeft: theme.spacing.sm,
    },
    separator: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginHorizontal: theme.spacing.sm,
    },
    trackCount: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    collaborators: {
      marginTop: theme.spacing.sm,
    },
    collaboratorsText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold,
    },
  });
