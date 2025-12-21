import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import debounce from 'lodash/debounce';
import { useTheme } from '@/contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { friendsApi, FriendProfile } from '@/services/friendsApi';
import { SearchBar } from '@/components/common/SearchBar';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserProfile } from '@/types';
import type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

type NavigationProp = NativeStackNavigationProp<FriendsStackParamList, 'Friends'>;

type Tab = 'friends' | 'search';

export function FriendsScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp>();
  const { accessToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    if (!accessToken) return;

    setIsFriendsLoading(true);
    try {
      const data = await friendsApi.getFriends(accessToken);
      setFriends(data);
      if (data.length === 0 && activeTab === 'friends') {
        setActiveTab('search');
      }
    } catch (err) {
      console.error('[FriendsScreen] Failed to load friends:', err);
    } finally {
      setIsFriendsLoading(false);
    }
  }, [accessToken, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends])
  );

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !accessToken) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const results = await profileApi.searchUsers(accessToken, query);
        setSearchResults(results);
      } catch (err) {
        setError('Erreur lors de la recherche');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [accessToken]
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
      setError(null);
    }
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderFriendItem = ({ item }: { item: FriendProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        {item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
      </View>
      <View style={styles.friendBadge}>
        <Text style={styles.friendBadgeText}>Ami</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const renderSearchResultItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        {item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  const hasFriends = friends.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Amis</Text>

        {/* Tabs - only show if user has friends */}
        {hasFriends && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
              onPress={() => setActiveTab('friends')}
            >
              <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
                Mes amis ({friends.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.tabActive]}
              onPress={() => setActiveTab('search')}
            >
              <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
                Rechercher
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(activeTab === 'search' || !hasFriends) && (
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Rechercher un utilisateur..."
            style={styles.searchBar}
          />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {activeTab === 'friends' &&
        hasFriends &&
        (isFriendsLoading ? (
          <LoadingSpinner size="large" />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={item => item.id}
            renderItem={renderFriendItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>Pas encore d'amis</Text>
                <Text style={styles.emptySubtext}>
                  Suivez des utilisateurs qui vous suivent en retour pour devenir amis !
                </Text>
              </View>
            }
          />
        ))}

      {(activeTab === 'search' || !hasFriends) &&
        (isSearching && searchResults.length === 0 ? (
          <LoadingSpinner size="large" />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={renderSearchResultItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              searchQuery ? (
                <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>Chercher un profil</Text>
                  <Text style={styles.emptySubtext}>
                    Commencez à taper pour trouver des utilisateurs !
                  </Text>
                </View>
              )
            }
          />
        ))}
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
      paddingBottom: theme.spacing.sm,
    },
    title: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.sm,
      padding: 4,
      marginBottom: theme.spacing.md,
      borderWidth: theme.borders.medium,
      borderColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.spacing.xs,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.surface,
      fontWeight: theme.typography.weights.semibold,
    },
    searchBar: {
      marginBottom: theme.spacing.sm,
    },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
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
    friendBadge: {
      backgroundColor: theme.colors.success + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.spacing.xs,
      marginRight: theme.spacing.sm,
    },
    friendBadgeText: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.success,
    },
    chevron: {
      fontSize: 24,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: theme.spacing.xxl * 2,
      paddingHorizontal: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontSize: 16,
      marginTop: theme.spacing.xl,
    },
    emptySubtext: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
  });
