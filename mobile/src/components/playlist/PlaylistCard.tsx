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
        <Text style={styles.name} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={styles.metaText} numberOfLines={1}>
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'} • {ownerName}
          {playlist.visibility === 'private' && ' • 🔒'}
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
    name: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginBottom: 2,
    },
    metaText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
  });
