import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { usePlaylistStore } from '../../store/playlistStore';
import { SearchBar, EmptyState } from '@components/common';
import { TrackItem } from '@components/playlist';
import { COLORS, SPACING, FONT_SIZES } from '@constants';
import { searchTracks } from '@mocks';
import type { Track } from '@types';

type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
};

type SearchTracksScreenNavigationProp = NativeStackNavigationProp<
  PlaylistStackParamList,
  'SearchTracks'
>;

type SearchTracksScreenRouteProp = RouteProp<PlaylistStackParamList, 'SearchTracks'>;

interface SearchTracksScreenProps {
  navigation: SearchTracksScreenNavigationProp;
  route: SearchTracksScreenRouteProp;
}

export function SearchTracksScreen({ navigation, route }: SearchTracksScreenProps) {
  const { playlistId } = route.params;
  const { addTrack, isLoading } = usePlaylistStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);

  useEffect(() => {
    // Initial results show all tracks
    setResults(searchTracks(''));
  }, []);

  useEffect(() => {
    // Search as user types
    const timer = setTimeout(() => {
      const searchResults = searchTracks(query);
      setResults(searchResults);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAddTrack = async (track: Track) => {
    try {
      await addTrack(playlistId, track.id);
      Alert.alert('Success', `"${track.title}" added to playlist`, [
        { text: 'Add More', style: 'cancel' },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add track';
      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search for tracks..."
          autoFocus
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <TrackItem track={item} />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddTrack(item)}
              disabled={isLoading}
            >
              <Text style={styles.addButtonText}>
                {isLoading ? '...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            message={
              query
                ? 'No tracks found. Try a different search term.'
                : 'Start typing to search for tracks'
            }
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
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  list: {
    flexGrow: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    marginRight: SPACING.md,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
});
