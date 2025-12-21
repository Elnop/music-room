import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { usePlaylistStore } from '../../store/playlistStore';
import { useAuthStore } from '../../store/authStore';
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

export function PlaylistDetailScreen({ navigation, route }: PlaylistDetailScreenProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { id } = route.params;
  const { user } = useAuthStore();
  const { currentPlaylist, isLoading, fetchPlaylistById, removeTrack } = usePlaylistStore();

  const isOwner = user && currentPlaylist?.ownerId === user.id;
  
  const canEdit = user && currentPlaylist ? (
    currentPlaylist.ownerId === user.id ||
    currentPlaylist.collaboratorIds.includes(user.id)
  ) : false;

  // Refresh playlist when screen receives focus
  // Note: useFocusEffect also triggers on mount, so no separate useEffect needed
  useFocusEffect(
    React.useCallback(() => {
      fetchPlaylistById(id);
    }, [id])
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
    }
  }, [navigation, isOwner, id]);

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
