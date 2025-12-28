import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { Playlist } from '@/types/playlist.types';

interface PlaylistCardProps {
  playlist: Playlist;
  trackCount: number;
  ownerName: string;
  onPress: () => void;
}

export function PlaylistCard({ playlist, trackCount, ownerName, onPress }: PlaylistCardProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const coverUrl = playlist.coverUrl || playlist.firstTrackCover;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.6}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.emptyCover]}>
          <Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {playlist.name}
          </Text>
          {playlist.visibility === 'private' && (
            <View style={styles.privateBadge}>
              <Ionicons name="lock-closed" size={10} color={theme.colors.textSecondary} />
              <Text style={styles.privateBadgeText}>Private</Text>
            </View>
          )}
        </View>
        <Text style={styles.metaText} numberOfLines={1}>
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'} • {ownerName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: theme.spacing.md,
    },
    cover: {
      width: 48,
      height: 48,
      borderRadius: 4,
      backgroundColor: theme.colors.surfaceAlt,
    },
    emptyCover: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    info: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    name: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      flexShrink: 1,
    },
    privateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    privateBadgeText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginLeft: 3,
      fontWeight: theme.typography.weights.medium,
    },
    metaText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
  });
