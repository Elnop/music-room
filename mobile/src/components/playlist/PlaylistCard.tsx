import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Card } from '@components/common';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
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
  const defaultCover = 'https://via.placeholder.com/150/1DB954/FFFFFF?text=Playlist';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <Image
          source={{ uri: playlist.coverUrl || defaultCover }}
          style={styles.cover}
        />
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

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  content: {
    flexDirection: 'row',
  },
  cover: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  separator: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
  private: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
