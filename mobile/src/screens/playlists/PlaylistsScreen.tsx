import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { PlaylistCard } from '@components/playlist';
import { EmptyState, LoadingSpinner } from '@components/common';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { findUserById, getPlaylistTrackCount } from '@mocks';

type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
};

type PlaylistsScreenNavigationProp = NativeStackNavigationProp<
  PlaylistStackParamList,
  'Playlists'
>;

interface PlaylistsScreenProps {
  navigation: PlaylistsScreenNavigationProp;
}

export function PlaylistsScreen({ navigation }: PlaylistsScreenProps) {
  const { user } = useAuthStore();
  const { playlists, isLoading, fetchPlaylists } = usePlaylistStore();

  useEffect(() => {
    if (user) {
      fetchPlaylists(user.id);
    }
  }, [user]);

  const handleRefresh = async () => {
    if (user) {
      await fetchPlaylists(user.id);
    }
  };

  const handlePlaylistPress = (id: string) => {
    navigation.navigate('PlaylistDetail', { id });
  };

  const handleCreatePress = () => {
    navigation.navigate('CreatePlaylist');
  };

  if (isLoading && playlists.length === 0) {
    return <LoadingSpinner fullScreen message="Loading playlists..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Playlists</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const owner = findUserById(item.ownerId);
          const trackCount = getPlaylistTrackCount(item.id);
          return (
            <PlaylistCard
              playlist={item}
              trackCount={trackCount}
              ownerName={owner?.displayName || owner?.username || 'Unknown'}
              onPress={() => handlePlaylistPress(item.id)}
            />
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎵"
            message="No playlists yet. Create your first playlist to get started!"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  list: {
    padding: SPACING.md,
    flexGrow: 1,
  },
});
