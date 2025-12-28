import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@store/authStore';
import { usePlaylistStore } from '@store/playlistStore';
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
  const playerHeight = usePlayerHeight();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuthStore();
  const { playlists, isLoading, fetchPlaylists } = usePlaylistStore();

  // État séparé pour le pull-to-refresh manuel (évite le décalage au focus)
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CreatePlaylist');
  }, [navigation]);

  // Configure le bouton "+" dans le header natif
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleCreatePress}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={28} color={theme.colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, handleCreatePress, theme.colors.text]);

  // Refresh silencieux au focus (pas de spinner visible)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchPlaylists(user.id);
      }
    }, [user, fetchPlaylists])
  );

  // Pull-to-refresh manuel (avec spinner)
  const handleRefresh = async () => {
    if (user) {
      setIsRefreshing(true);
      await fetchPlaylists(user.id);
      setIsRefreshing(false);
    }
  };

  const handlePlaylistPress = (id: string) => {
    navigation.navigate('PlaylistDetail', { id });
  };

  if (isLoading && playlists.length === 0) {
    return <LoadingSpinner fullScreen message="Chargement des playlists..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isOwner = user && item.ownerId === user.id;
          const ownerName =
            item.owner?.displayName ||
            item.owner?.username ||
            (isOwner ? user.displayName || user.username || 'Vous' : 'Inconnu');

          return (
            <PlaylistCard
              playlist={item}
              trackCount={item.trackCount}
              ownerName={ownerName}
              onPress={() => handlePlaylistPress(item.id)}
            />
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="musical-notes-outline"
            message="Aucune playlist pour l'instant. Créez votre première playlist !"
          />
        }
      />
    </View>
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
      paddingTop: theme.spacing.xs,
    },
  });
