import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@store/authStore';
import { usePlaylistStore } from '@store/playlistStore';
import { playlistApi } from '@api/playlistApi';
import { friendsApi, type FriendProfile } from '@/services/friendsApi';
import { PlaylistGridCard } from '@components/playlist/PlaylistGridCard';
import { FriendPlaylistSection } from '@components/playlist/FriendPlaylistSection';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import type { Playlist } from '@/types/playlist.types';

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

interface FriendPlaylistData {
  friend: FriendProfile;
  playlists: Playlist[];
}

export function PlaylistsScreen({ navigation }: PlaylistsScreenProps) {
  const { theme } = useTheme();
  const playerHeight = usePlayerHeight();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user, accessToken } = useAuthStore();
  const { playlists, isLoading, fetchPlaylists } = usePlaylistStore();

  // État pour les playlists des amis
  const [friendsPlaylists, setFriendsPlaylists] = useState<FriendPlaylistData[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  // État pour les playlists publiques
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  // État pour le pull-to-refresh manuel
  const [isRefreshing, setIsRefreshing] = useState(false);

  // État pour les sections collapsibles
  const [isMyPlaylistsOpen, setIsMyPlaylistsOpen] = useState(true);
  const [isPublicPlaylistsOpen, setIsPublicPlaylistsOpen] = useState(true);

  // Séparer mes playlists (celles dont je suis le propriétaire)
  const myPlaylists = playlists.filter(p => user && p.ownerId === user.id);

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

  // Charger les playlists des amis
  const loadFriendsPlaylists = useCallback(async () => {
    if (!accessToken) return;

    setIsFriendsLoading(true);
    try {
      const friends = await friendsApi.getFriends(accessToken);

      // Charger les playlists de chaque ami en parallèle
      const friendsPlaylistsData = await Promise.all(
        friends.map(async friend => {
          try {
            const friendPlaylists = await playlistApi.fetchUserPublicPlaylists(friend.id);
            return { friend, playlists: friendPlaylists };
          } catch {
            return { friend, playlists: [] };
          }
        })
      );

      // Filtrer les amis sans playlists
      setFriendsPlaylists(friendsPlaylistsData.filter(fp => fp.playlists.length > 0));
    } catch (error) {
      console.error('[PlaylistsScreen] Failed to load friends playlists:', error);
    } finally {
      setIsFriendsLoading(false);
    }
  }, [accessToken]);

  // Charger les playlists publiques
  const loadPublicPlaylists = useCallback(async () => {
    setIsPublicLoading(true);
    try {
      const playlists = await playlistApi.fetchPublicPlaylists();
      setPublicPlaylists(playlists);
    } catch (error) {
      console.error('[PlaylistsScreen] Failed to load public playlists:', error);
    } finally {
      setIsPublicLoading(false);
    }
  }, []);

  // Refresh silencieux au focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchPlaylists(user.id);
        loadFriendsPlaylists();
        loadPublicPlaylists();
      }
    }, [user, fetchPlaylists, loadFriendsPlaylists, loadPublicPlaylists])
  );

  // Pull-to-refresh manuel
  const handleRefresh = async () => {
    if (user) {
      setIsRefreshing(true);
      await Promise.all([fetchPlaylists(user.id), loadFriendsPlaylists(), loadPublicPlaylists()]);
      setIsRefreshing(false);
    }
  };

  const handlePlaylistPress = (id: string) => {
    navigation.navigate('PlaylistDetail', { id });
  };

  if (isLoading && playlists.length === 0) {
    return <LoadingSpinner fullScreen message="Chargement des playlists..." />;
  }

  const renderHeader = () => (
    <View>
      {/* Section: Playlists des amis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="people-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Playlists de vos amis</Text>
          </View>
          {friendsPlaylists.length > 0 && (
            <Text style={styles.sectionCount}>
              {friendsPlaylists.reduce((acc, fp) => acc + fp.playlists.length, 0)}
            </Text>
          )}
        </View>

        {isFriendsLoading && friendsPlaylists.length === 0 ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner message="" />
          </View>
        ) : (
          <FriendPlaylistSection
            friendsPlaylists={friendsPlaylists}
            onPlaylistPress={handlePlaylistPress}
          />
        )}
      </View>

      {/* Spacer */}
      <View style={styles.sectionSpacer} />

      {/* Section: Mes playlists - Collapsible */}
      <View style={styles.section}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setIsMyPlaylistsOpen(!isMyPlaylistsOpen)}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="library-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Vos playlists</Text>
            {myPlaylists.length > 0 && (
              <Text style={styles.sectionCountInline}>{myPlaylists.length}</Text>
            )}
          </View>
          <Ionicons
            name={isMyPlaylistsOpen ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </Pressable>

        {isMyPlaylistsOpen &&
          (myPlaylists.length > 0 ? (
            <View style={styles.myPlaylistsGrid}>
              {myPlaylists.map(playlist => (
                <PlaylistGridCard
                  key={playlist.id}
                  playlist={playlist}
                  onPress={() => handlePlaylistPress(playlist.id)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="musical-notes-outline"
              message="Aucune playlist pour l'instant. Créez votre première playlist !"
            />
          ))}
      </View>
    </View>
  );

  const renderFooter = () => (
    <View>
      {/* Spacer */}
      <View style={styles.sectionSpacer} />

      {/* Section: Playlists publiques - Collapsible */}
      <View style={styles.section}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setIsPublicPlaylistsOpen(!isPublicPlaylistsOpen)}
        >
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="globe-outline"
              size={18}
              color={theme.colors.textSecondary}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Playlists publiques</Text>
            {publicPlaylists.length > 0 && (
              <Text style={styles.sectionCountInline}>{publicPlaylists.length}</Text>
            )}
          </View>
          <Ionicons
            name={isPublicPlaylistsOpen ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </Pressable>

        {isPublicPlaylistsOpen &&
          (isPublicLoading && publicPlaylists.length === 0 ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner message="" />
            </View>
          ) : publicPlaylists.length > 0 ? (
            <View style={styles.publicPlaylistsGrid}>
              {publicPlaylists.map(playlist => (
                <PlaylistGridCard
                  key={playlist.id}
                  playlist={playlist}
                  onPress={() => handlePlaylistPress(playlist.id)}
                  showOwner
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyPublicContainer}>
              <Text style={styles.emptyPublicText}>Aucune playlist publique disponible</Text>
            </View>
          ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        keyExtractor={() => 'dummy'}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={() => null}
        contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xl }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
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
      paddingTop: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionIcon: {
      marginRight: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    sectionCount: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    sectionCountInline: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
    },
    sectionSpacer: {
      height: theme.spacing.md,
    },
    loadingContainer: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
    },
    myPlaylistsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: theme.spacing.md,
      gap: 16,
    },
    publicPlaylistsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: theme.spacing.md,
      gap: 16,
    },
    emptyPublicContainer: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
    },
    emptyPublicText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });
