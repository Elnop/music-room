import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useImageColors, hexToRgba } from '@/hooks/useImageColors';
import type { Theme } from '@themes/types';
import type { Track } from '@/types/track.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import { usePlaylistStore } from '@store/playlistStore';
import { useAuthStore } from '@store/authStore';
import { usePlayerStore } from '@store/playerStore';
import { usePlaylistSocket } from '@hooks/usePlaylistSocket';
import { PlaylistHeader } from '@components/playlist/PlaylistHeader';
import { TrackItem } from '@components/playlist/TrackItem';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
  PlaylistSharing: { playlistId: string };
};

type PlaylistDetailScreenNavigationProp = NativeStackNavigationProp<
  PlaylistStackParamList,
  'PlaylistDetail'
>;

type PlaylistDetailScreenRouteProp = RouteProp<PlaylistStackParamList, 'PlaylistDetail'>;

interface PlaylistDetailScreenProps {
  navigation: PlaylistDetailScreenNavigationProp;
  route: PlaylistDetailScreenRouteProp;
}

const hashStringToNumber = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash);
};

const trackToSoundCloud = (track: Track): SoundCloudTrack => {
  const parsed = parseInt(track.id, 10);
  const trackId = !Number.isNaN(parsed) ? parsed : hashStringToNumber(track.trackUri || track.id);

  return {
    id: trackId,
    title: track.title,
    description: null,
    duration: track.durationMs,
    genre: null,
    artwork_url: track.albumArt || null,
    permalink_url: track.trackUri,
    user: {
      id: trackId,
      username: track.artist,
      avatar_url: track.albumArt || null,
      permalink_url: track.trackUri,
    },
    playable: true,
  };
};

export function PlaylistDetailScreen({ navigation, route }: PlaylistDetailScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const playerHeight = usePlayerHeight();
  const styles = React.useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const { id } = route.params;
  const { user } = useAuthStore();
  const { currentPlaylist, isLoading, fetchPlaylistById, removeTrack } = usePlaylistStore();
  const {
    currentTrack,
    isPlaying,
    loading: playerLoading,
    playTrack,
    pause,
    resume,
  } = usePlayerStore();

  // Get cover URL for color extraction
  const coverUrl = currentPlaylist?.coverUrl || currentPlaylist?.tracks[0]?.albumArt;
  const { dominantColor } = useImageColors(coverUrl, theme.colors.primary);

  const isOwner = user && currentPlaylist?.ownerId === user.id;

  const canEdit = React.useMemo(() => {
    if (!user || !currentPlaylist) return false;
    if (currentPlaylist.ownerId === user.id) return true;
    if (currentPlaylist.collaboratorIds.includes(user.id)) return true;
    if (currentPlaylist.editMode === 'open') {
      if (currentPlaylist.visibility === 'public') return true;
      if (currentPlaylist.viewerIds?.includes(user.id)) return true;
    }
    return false;
  }, [user, currentPlaylist]);

  const handleReorderUpdate = React.useCallback(() => {
    fetchPlaylistById(id);
  }, [id, fetchPlaylistById]);

  usePlaylistSocket(id, handleReorderUpdate);

  useFocusEffect(
    React.useCallback(() => {
      fetchPlaylistById(id);
    }, [id, fetchPlaylistById])
  );

  const handleShare = useCallback(() => {
    navigation.navigate('PlaylistSharing', { playlistId: id });
  }, [navigation, id]);

  // Configure header natif transparent avec bouton partage
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
      headerRight: isOwner
        ? () => (
            <Pressable
              onPress={handleShare}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, isOwner, handleShare, theme.colors.text]);

  const handleAddTrack = () => {
    navigation.navigate('SearchTracks', { playlistId: id });
  };

  const handlePlayTrack = (track: Track) => {
    const isCurrentTrack = currentTrack?.permalink_url === track.trackUri;

    if (isCurrentTrack) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playTrack(trackToSoundCloud(track));
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!canEdit) {
      Alert.alert('Permission refusée', 'Vous ne pouvez pas modifier cette playlist');
      return;
    }

    Alert.alert('Supprimer le titre', 'Voulez-vous vraiment supprimer ce titre de la playlist ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTrack(id, trackId);
          } catch (error) {
            console.error('[PlaylistDetailScreen] Remove track failed:', error);
            Alert.alert('Erreur', 'Impossible de supprimer le titre');
          }
        },
      },
    ]);
  };

  // Gradient colors based on extracted dominant color
  const gradientColors = dominantColor
    ? ([
        hexToRgba(dominantColor, 0.9),
        hexToRgba(dominantColor, 0.6),
        hexToRgba(dominantColor, 0.3),
        theme.colors.background,
      ] as const)
    : ([
        theme.colors.background,
        theme.colors.background,
        theme.colors.background,
        theme.colors.background,
      ] as const);

  if (isLoading || !currentPlaylist) {
    return <LoadingSpinner fullScreen message="Chargement de la playlist..." />;
  }

  return (
    <View style={styles.container}>
      {/* Full screen gradient background */}
      <LinearGradient
        colors={gradientColors as unknown as [string, string, ...string[]]}
        locations={[0, 0.25, 0.5, 0.8]}
        style={styles.gradientBackground}
      />

      {/* Content */}
      <FlatList
        data={currentPlaylist.tracks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isCurrentlyPlaying = currentTrack?.permalink_url === item.trackUri;
          return (
            <TrackItem
              track={item}
              showDelete={canEdit}
              onDelete={() => handleDeleteTrack(item.id)}
              onPlay={() => handlePlayTrack(item)}
              isPlaying={isCurrentlyPlaying && isPlaying}
              isLoading={isCurrentlyPlaying && playerLoading}
            />
          );
        }}
        ListHeaderComponent={
          <PlaylistHeader
            playlist={currentPlaylist}
            canEdit={canEdit}
            onAddTrack={handleAddTrack}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xxl }]}
        ListEmptyComponent={
          <EmptyState
            icon="musical-notes-outline"
            message="Aucun titre dans cette playlist. Ajoutez des titres pour commencer !"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (theme: Theme, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 450, // Gradient covers top portion
    },
    list: {
      flexGrow: 1,
      paddingTop: topInset + 60, // Space for floating header
      paddingBottom: theme.spacing.xxl,
    },
  });
