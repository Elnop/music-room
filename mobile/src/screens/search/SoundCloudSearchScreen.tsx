import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts';
import { useSoundCloudStore } from '@/store/soundcloudStore';
import { usePlayerStore } from '@/store/playerStore';
import { SoundCloudTrackItem } from './components/SoundCloudTrackItem';
import { PlaylistSelectorModal } from './components/PlaylistSelectorModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import debounce from 'lodash/debounce';
import type { SoundCloudTrack } from '@/types';

export function SoundCloudSearchScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<SoundCloudTrack | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const { searchResults, isSearching, error, search, clearSearch, clearError } =
    useSoundCloudStore();
  const { playTrack } = usePlayerStore();

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        search(query);
      }, 500),
    [search]
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      debouncedSearch(text);
    } else {
      clearSearch();
    }
  };

  const handlePlay = (track: SoundCloudTrack) => {
    playTrack(track);
  };

  const handleAddToPlaylist = (track: SoundCloudTrack) => {
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Music</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search SoundCloud..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSearching && searchResults.length === 0 ? (
        <LoadingSpinner size="large" />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <SoundCloudTrackItem
              track={item}
              onPlay={handlePlay}
              onAddToPlaylist={handleAddToPlaylist}
            />
          )}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>No tracks found</Text>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎵</Text>
                <Text style={styles.emptyText}>Search for music on SoundCloud</Text>
                <Text style={styles.emptySubtext}>Find tracks to add to your playlists</Text>
              </View>
            )
          }
        />
      )}

      <PlaylistSelectorModal
        visible={showPlaylistModal}
        track={selectedTrack}
        onClose={() => setShowPlaylistModal(false)}
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
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borders.medium,
      padding: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.borders.small,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      flex: 1,
    },
    dismissText: {
      color: theme.colors.error,
      fontWeight: theme.typography.weights.semibold,
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
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontSize: 18,
      fontWeight: theme.typography.weights.semibold,
      marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
  });
