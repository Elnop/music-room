import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import debounce from 'lodash/debounce';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '../../store/authStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { profileApi } from '@services/profileApi';
import { playlistApi, ViewerProfile } from '@api/playlistApi';
import { SearchBar } from '@components/common/SearchBar';
import { Avatar } from '@components/common/Avatar';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import type { UserProfile } from '@types';

type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  PlaylistSharing: { playlistId: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
};

type PlaylistSharingScreenNavigationProp = NativeStackNavigationProp<
  PlaylistStackParamList,
  'PlaylistSharing'
>;

type PlaylistSharingScreenRouteProp = RouteProp<PlaylistStackParamList, 'PlaylistSharing'>;

interface PlaylistSharingScreenProps {
  navigation: PlaylistSharingScreenNavigationProp;
  route: PlaylistSharingScreenRouteProp;
}

interface Member {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  canEdit: boolean;
}

const toMember = (user: UserProfile | ViewerProfile, canEdit: boolean): Member => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  canEdit,
});

export function PlaylistSharingScreen({ route }: PlaylistSharingScreenProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { playlistId } = route.params;
  const { accessToken } = useAuthStore();
  const { currentPlaylist, fetchPlaylistById } = usePlaylistStore();

  // SINGLE source of truth for all members
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const loadingRef = useRef(false);

  const isPrivate = currentPlaylist?.visibility === 'private';

  const loadAllData = useCallback(async () => {
    if (!accessToken || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      await fetchPlaylistById(playlistId);
    } catch (error) {
      console.error('[PlaylistSharing] Failed to fetch playlist:', error);
      Alert.alert('Erreur', 'Impossible de charger la playlist');
      setIsLoading(false);
      loadingRef.current = false;
      return;
    }

    try {
      const viewersData = await playlistApi.getViewers(playlistId);

      const { currentPlaylist: updatedPlaylist } = usePlaylistStore.getState();

      if (!updatedPlaylist) {
        throw new Error('Playlist not found after fetch');
      }

      const editorIds = updatedPlaylist.collaboratorIds || [];
      let editorProfiles: ViewerProfile[] = [];

      if (editorIds.length > 0) {
        const profiles = await Promise.all(
          editorIds.map((id: string) => profileApi.getUserProfile(accessToken, id))
        );
        editorProfiles = profiles.map(p => ({
          id: p.id,
          username: p.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        }));
      }

      const allMembers: Member[] = [];
      const addedIds = new Set<string>();

      editorProfiles.forEach(e => {
        if (!addedIds.has(e.id)) {
          allMembers.push(toMember(e, true));
          addedIds.add(e.id);
        }
      });

      viewersData.forEach(v => {
        if (!addedIds.has(v.id)) {
          allMembers.push(toMember(v, false));
          addedIds.add(v.id);
        }
      });

      setMembers(allMembers);
    } catch (error) {
      console.error('[PlaylistSharing] Failed to load members:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [accessToken, playlistId, fetchPlaylistById]);

  useEffect(() => {
    loadAllData();
  }, [playlistId, loadAllData]);

  useFocusEffect(
    useCallback(() => {
      if (!loadingRef.current) {
        loadAllData();
      }
    }, [loadAllData])
  );

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !accessToken) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const results = await profileApi.searchUsers(accessToken, query);
        const filteredResults = results.filter(user => {
          if (user.id === currentPlaylist?.ownerId) return false;
          if (members.some(m => m.id === user.id)) return false;
          return true;
        });
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('[PlaylistSharing] Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [accessToken, members, currentPlaylist?.ownerId]
  );

  const debouncedSearch = React.useMemo(
    () => debounce((query: string) => performSearch(query), 500),
    [performSearch]
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      debouncedSearch(text);
    } else {
      debouncedSearch.cancel();
      setSearchResults([]);
    }
  };

  const handleAddUser = async (user: UserProfile) => {
    if (processingUserId) return;

    const newMember = toMember(user, !isPrivate);

    setMembers(prev => [...prev, newMember]);
    setSearchQuery('');
    setSearchResults([]);
    setProcessingUserId(user.id);

    try {
      if (isPrivate) {
        await playlistApi.addViewer(playlistId, user.id);
      } else {
        await playlistApi.addCollaborator(playlistId, user.id);
      }
    } catch (err) {
      setMembers(prev => prev.filter(m => m.id !== user.id));
      Alert.alert(
        'Erreur',
        err instanceof Error ? err.message : "Impossible d'ajouter l'utilisateur"
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (processingUserId) return;

    const member = members.find(m => m.id === userId);
    if (!member) return;

    const userName = member.displayName || member.username || 'cet utilisateur';

    Alert.alert("Retirer l'accès", `Retirer ${userName} de la playlist ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          const originalMembers = [...members];

          setMembers(prev => prev.filter(m => m.id !== userId));
          setProcessingUserId(userId);

          try {
            if (isPrivate) {
              if (member.canEdit) {
                await playlistApi.removeCollaborator(playlistId, userId);
              }
              try {
                await playlistApi.removeViewer(playlistId, userId);
              } catch {}
            } else {
              await playlistApi.removeCollaborator(playlistId, userId);
            }
          } catch (error) {
            console.error('[PlaylistSharing] Remove failed:', error);
            setMembers(originalMembers);
            Alert.alert('Erreur', "Impossible de retirer l'utilisateur");
          } finally {
            setProcessingUserId(null);
          }
        },
      },
    ]);
  };

  const handleToggleEdit = async (userId: string, currentCanEdit: boolean) => {
    if (processingUserId) return;

    const memberIndex = members.findIndex(m => m.id === userId);
    if (memberIndex === -1) return;

    const originalMembers = [...members];

    setMembers(prev => prev.map(m => (m.id === userId ? { ...m, canEdit: !currentCanEdit } : m)));
    setProcessingUserId(userId);

    try {
      if (currentCanEdit) {
        let collaboratorRemoved = false;
        try {
          await playlistApi.removeCollaborator(playlistId, userId);
          collaboratorRemoved = true;
          await playlistApi.addViewer(playlistId, userId);
        } catch (error) {
          if (collaboratorRemoved) {
            try {
              await playlistApi.addCollaborator(playlistId, userId);
            } catch (rollbackError) {
              console.error(
                '[PlaylistSharing] Rollback failed (restore collaborator):',
                rollbackError
              );
            }
          }
          throw error;
        }
      } else {
        let viewerRemoved = false;
        try {
          await playlistApi.removeViewer(playlistId, userId);
          viewerRemoved = true;
          await playlistApi.addCollaborator(playlistId, userId);
        } catch (error) {
          if (viewerRemoved) {
            try {
              await playlistApi.addViewer(playlistId, userId);
            } catch (rollbackError) {
              console.error('[PlaylistSharing] Rollback failed (restore viewer):', rollbackError);
            }
          }
          throw error;
        }
      }
    } catch (error) {
      console.error('[PlaylistSharing] Toggle failed:', error);
      setMembers(originalMembers);
      Alert.alert('Erreur', 'Impossible de modifier les permissions');
    } finally {
      setProcessingUserId(null);
    }
  };

  const renderSearchResultItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleAddUser(item)}
      activeOpacity={0.7}
      disabled={!!processingUserId}
    >
      <Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        {item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
      </View>
      <View style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item }: { item: Member }) => {
    const isProcessing = processingUserId === item.id;

    if (!isPrivate) {
      return (
        <View style={[styles.memberItem, isProcessing && styles.memberItemProcessing]}>
          <Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            {item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveUser(item.id)}
            disabled={!!processingUserId}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.memberItem, isProcessing && styles.memberItemProcessing]}>
        <Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
        </View>
        <View style={styles.editToggleContainer}>
          <Text style={styles.editLabel}>Édition</Text>
          {isProcessing ? (
            <View style={styles.switchPlaceholder}>
              <LoadingSpinner size="small" />
            </View>
          ) : (
            <Switch
              value={item.canEdit}
              onValueChange={() => handleToggleEdit(item.id, item.canEdit)}
              disabled={!!processingUserId}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveUser(item.id)}
          disabled={!!processingUserId}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{isPrivate ? 'Accès' : 'Éditeurs'}</Text>
        <Text style={styles.subtitle}>
          {isPrivate
            ? 'Gérez qui peut voir et modifier cette playlist privée.'
            : 'Gérez qui peut modifier cette playlist.'}
        </Text>
      </View>

      <View style={styles.content}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Rechercher un utilisateur..."
          style={styles.searchBar}
        />

        {searchQuery.trim() && (
          <View style={styles.searchResults}>
            <Text style={styles.sectionTitle}>Résultats</Text>
            {isSearching ? (
              <LoadingSpinner size="small" />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={renderSearchResultItem}
                style={styles.resultsList}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noResults}>Aucun utilisateur trouvé</Text>
            )}
          </View>
        )}

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            {isPrivate
              ? `Personnes avec accès (${members.length})`
              : `Éditeurs (${members.length})`}
          </Text>

          {members.length > 0 ? (
            <FlatList
              data={members}
              keyExtractor={item => item.id}
              renderItem={renderMemberItem}
              style={styles.membersList}
              extraData={processingUserId}
            />
          ) : (
            <Text style={styles.noMembers}>
              {isPrivate ? "Aucune personne n'a accès à cette playlist" : 'Aucun éditeur ajouté'}
            </Text>
          )}
        </View>
      </View>
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
      padding: theme.spacing.lg,
      borderBottomWidth: theme.borders.medium,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    searchBar: {
      marginBottom: theme.spacing.md,
    },
    searchResults: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    resultsList: {
      maxHeight: 200,
    },
    noResults: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.sm,
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
    },
    memberItemProcessing: {
      opacity: 0.6,
    },
    userInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    username: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    displayName: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 24,
      color: theme.colors.surface,
      fontWeight: theme.typography.weights.bold,
      lineHeight: 26,
    },
    editToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
      minWidth: 100,
    },
    editLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.xs,
    },
    switchPlaceholder: {
      width: 51,
      height: 31,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonText: {
      fontSize: 24,
      color: theme.colors.surface,
      fontWeight: theme.typography.weights.bold,
      lineHeight: 26,
    },
    membersSection: {
      flex: 1,
    },
    membersList: {
      flex: 1,
    },
    noMembers: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.sm,
      textAlign: 'center',
      paddingVertical: theme.spacing.xl,
    },
  });
