import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '../../store/authStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { PlaylistCard } from '@components/playlist/PlaylistCard';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
};

type PlaylistsScreenNavigationProp = NativeStackNavigationProp<PlaylistStackParamList, 'Playlists'>;

interface PlaylistsScreenProps {
  navigation: PlaylistsScreenNavigationProp;
}

export function PlaylistsScreen({ navigation }: PlaylistsScreenProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuthStore();
  const { playlists, isLoading, fetchPlaylists } = usePlaylistStore();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchPlaylists(user.id);
      }
    }, [user])
  );

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
          const isOwner = user && item.ownerId === user.id;
          const ownerName =
            item.owner?.displayName ||
            item.owner?.username ||
            (isOwner ? user.displayName || user.username || 'You' : 'Unknown');

          return (
            <PlaylistCard
              playlist={item}
              trackCount={item.trackCount}
              ownerName={ownerName}
              onPress={() => handlePlaylistPress(item.id)}
            />
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 20,
    },
    createButtonText: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.background,
    },
    list: {
      padding: theme.spacing.md,
      flexGrow: 1,
    },
  });
