import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import debounce from 'lodash/debounce';
import { useTheme } from '@/contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { SearchBar } from '@/components/common/SearchBar';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserProfile } from '@/types';
import type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

type NavigationProp = NativeStackNavigationProp<FriendsStackParamList, 'Friends'>;

export function FriendsScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp>();
  const { accessToken } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError('Failed to search users');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [accessToken]
  );

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 500),
    [performSearch]
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      debouncedSearch(text);
    } else {
      debouncedSearch.cancel(); // Cancel pending search
      setSearchResults([]);
      setError(null);
    }
  };

  const handleUserPress = (user: UserProfile) => {
    navigation.navigate('UserProfile', { userId: user.id });
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search users..."
          style={styles.searchBar}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isSearching && searchResults.length === 0 ? (
        <LoadingSpinner size="large" />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>No users found</Text>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Chercher un profil</Text>
                <Text style={styles.emptySubtext}>Commencez à taper pour trouver des amis !</Text>
              </View>
            )
          }
        />
      )}
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
    },
    title: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
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
