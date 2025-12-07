import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { usePlaylistStore } from '../../store/playlistStore';
import { useAuthStore } from '../../store/authStore';
import { PlaylistHeader, TrackItem, AddTrackButton } from '@components/playlist';
import { EmptyState, LoadingSpinner } from '@components/common';
import { COLORS, SPACING } from '@constants';
import { canEditPlaylist } from '@mocks';

type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
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

export function PlaylistDetailScreen({ navigation, route }: PlaylistDetailScreenProps) {
  const { id } = route.params;
  const { user } = useAuthStore();
  const { currentPlaylist, isLoading, fetchPlaylistById, removeTrack } = usePlaylistStore();

  // Refresh playlist when screen receives focus (e.g., returning from SpotifySearchScreen)
  // Note: useFocusEffect also triggers on mount, so no separate useEffect needed
  useFocusEffect(
    React.useCallback(() => {
      fetchPlaylistById(id);
    }, [id])
  );

  const canEdit = user ? canEditPlaylist(id, user.id) : false;

  const handleAddTrack = () => {
    navigation.navigate('SearchTracks', { playlistId: id });
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You cannot edit this playlist');
      return;
    }

    Alert.alert(
      'Remove Track',
      'Are you sure you want to remove this track from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTrack(id, trackId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove track');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !currentPlaylist) {
    return <LoadingSpinner fullScreen message="Loading playlist..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={currentPlaylist.tracks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TrackItem
            track={item}
            showDelete={canEdit}
            onDelete={() => handleDeleteTrack(item.id)}
          />
        )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
});
