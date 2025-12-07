import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSpotifyStore } from '../../store/spotifyStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { useAuthStore } from '../../store/authStore';
import { SearchBar, EmptyState, LoadingSpinner, Button } from '@components/common';
import { SpotifyTrackItem } from './components/SpotifyTrackItem';
import { PlaylistSelectorModal } from './components/PlaylistSelectorModal';
import { convertSpotifyTrackToTrack } from '@utils/spotifyHelpers';
import { COLORS, SPACING } from '@constants';
import type { SpotifyTrack } from '@types';

export function SpotifySearchScreen() {
  const navigation = useNavigation();

  // Zustand stores
  const {
    searchResults,
    isSearching,
    error: spotifyError,
    search,
    clearSearch,
    connectionStatus,
    checkStatus,
  } = useSpotifyStore();

  const {
    playlists,
    fetchPlaylists,
    addTrack,
    isLoading: isAddingTrack,
  } = usePlaylistStore();

  const { user } = useAuthStore();

  // Local state
  const [query, setQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Check Spotify connection and load playlists on mount
  useEffect(() => {
    checkStatus();
    if (user?.id) {
      fetchPlaylists(user.id);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle add track flow
  const handleAddTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!selectedTrack) return;

    try {
      const convertedTrack = convertSpotifyTrackToTrack(selectedTrack);
      await addTrack(playlistId, convertedTrack);

      // Refresh playlists to update trackCount
      if (user) {
        await fetchPlaylists(user.id);
      }

      setShowPlaylistModal(false);
      setSelectedTrack(null);

      Alert.alert('Success', `"${selectedTrack.name}" added to playlist`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add track to playlist');
    }
  };

  const handleCloseModal = () => {
    setShowPlaylistModal(false);
    setSelectedTrack(null);
  };

  // Navigate to Spotify connection screen
  const handleConnectSpotify = () => {
    navigation.navigate('ProfileTab' as never);
  };

  // Render not connected state
  if (connectionStatus && !connectionStatus.connected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notConnectedContainer}>
          <EmptyState
            icon="🎵"
            message="Connect Spotify to search tracks"
          />
          <Button
            onPress={handleConnectSpotify}
            variant="primary"
            style={styles.connectButton}
          >
            Connect Spotify
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Search Header */}
        <View style={styles.header}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search for tracks..."
            autoFocus
          />
        </View>

        {/* Results List */}
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SpotifyTrackItem
              track={item}
              onAdd={handleAddTrack}
              isAdding={isAddingTrack}
            />
          )}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            isSearching ? (
              <LoadingSpinner fullScreen message="Searching..." />
            ) : (
              <EmptyState
                icon="🔍"
                message={
                  query
                    ? 'No tracks found. Try different keywords.'
                    : "Search Spotify's entire catalog"
                }
              />
            )
          }
        />

        {/* Playlist Selector Modal */}
        <PlaylistSelectorModal
          visible={showPlaylistModal}
          playlists={playlists}
          selectedTrack={selectedTrack}
          onSelectPlaylist={handleSelectPlaylist}
          onClose={handleCloseModal}
          isLoading={isAddingTrack}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listContent: {
    flexGrow: 1,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  connectButton: {
    marginTop: SPACING.lg,
    minWidth: 200,
  },
});
