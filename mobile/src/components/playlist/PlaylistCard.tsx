import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Card } from '@components/common/Card';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import type { Playlist } from '@types';

interface PlaylistCardProps {
  playlist: Playlist;
  trackCount: number;
  ownerName: string;
  onPress: () => void;
}

export function PlaylistCard({
  playlist,
  trackCount,
  ownerName,
  onPress,
}: PlaylistCardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const coverUrl = playlist.coverUrl || playlist.firstTrackCover;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.emptyCover]}>
            <Text style={styles.emptyIcon}>🎵</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {playlist.name}
          </Text>
          {playlist.description && (
            <Text style={styles.description} numberOfLines={2}>
              {playlist.description}
            </Text>
          )}
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.metaText}>by {ownerName}</Text>
            {playlist.visibility === 'private' && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.private}>Private</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    content: {
      flexDirection: 'row',
    },
    cover: {
      width: 80,
      height: 80,
      borderRadius: theme.borders.small,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: theme.borders.thin,
      borderColor: theme.colors.border,
    },
    emptyCover: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 32,
    },
    info: {
      flex: 1,
      marginLeft: theme.spacing.md,
      justifyContent: 'center',
    },
    name: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold, // 600 - bold
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    description: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
    },
    separator: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginHorizontal: theme.spacing.xs,
    },
    private: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold, // 600
    },
  });
