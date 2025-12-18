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
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { usePlaylistStore } from '../../store/playlistStore';
import { SearchBar } from '@components/common/SearchBar';
import { EmptyState } from '@components/common/EmptyState';
import { TrackItem } from '@components/playlist/TrackItem';
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
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
      await addTrack(playlistId, track);
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    list: {
      flexGrow: 1,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 16,
      marginRight: theme.spacing.md,
      minWidth: 60,
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.background,
    },
  });
