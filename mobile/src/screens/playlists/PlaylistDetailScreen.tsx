import React from 'react';
import { FlatList, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import type { Track, SoundCloudTrack } from '@types';
import { usePlaylistStore } from '../../store/playlistStore';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistSocket } from '@hooks/usePlaylistSocket';
import { PlaylistHeader } from '@components/playlist/PlaylistHeader';
import { TrackItem } from '@components/playlist/TrackItem';
import { AddTrackButton } from '@components/playlist/AddTrackButton';
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
    hash |= 0; // Convert to 32-bit integer
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
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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

  // Refresh playlist when screen receives focus
  // Note: useFocusEffect also triggers on mount, so no separate useEffect needed
  useFocusEffect(
    React.useCallback(() => {
      fetchPlaylistById(id);
    }, [id, fetchPlaylistById])
  );

  React.useLayoutEffect(() => {
    if (isOwner) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PlaylistSharing', { playlistId: id })}
            style={{ paddingHorizontal: 8 }}
          >
            <Text style={{ fontSize: 20 }}>👥</Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: undefined,
      });
    }
  }, [navigation, isOwner, id]);

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
      Alert.alert('Permission Denied', 'You cannot edit this playlist');
      return;
    }

    Alert.alert('Remove Track', 'Are you sure you want to remove this track from the playlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTrack(id, trackId);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            Alert.alert('Error', 'Failed to remove track');
          }
        },
      },
    ]);
  };

  if (isLoading || !currentPlaylist) {
    return <LoadingSpinner fullScreen message="Loading playlist..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
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
        ListHeaderComponent={<PlaylistHeader playlist={currentPlaylist} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="🎵"
            message="No tracks in this playlist yet. Add some tracks to get started!"
          />
        }
      />
      {canEdit && <AddTrackButton onPress={handleAddTrack} />}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    list: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xxl,
    },
  });
