import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { usePlaylistStore } from '../../store/playlistStore';
import { useSoundCloudStore } from '../../store/soundcloudStore';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import debounce from 'lodash/debounce';
import type { SoundCloudTrack, Track } from '@types';

type NewTrackInput = Omit<Track, 'id'> & { id?: string };

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
  const { addTrack } = usePlaylistStore();
  const { searchResults, isSearching, search, clearSearch } = useSoundCloudStore();
  const [query, setQuery] = useState('');
  const [addingTrackId, setAddingTrackId] = useState<number | null>(null);

  const debouncedSearch = React.useMemo(
    () =>
      debounce((q: string) => {
        if (q.trim()) {
          search(q);
        } else {
          clearSearch();
        }
      }, 500),
    [search, clearSearch]
  );

  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const handleAddTrack = async (track: SoundCloudTrack) => {
    setAddingTrackId(track.id);
    try {
      const internalTrack: NewTrackInput = {
        title: track.title,
        artist: track.user.username,
        album: undefined,
        albumArt: track.artwork_url || track.user.avatar_url || '',
        durationMs: track.duration,
        trackUri: track.permalink_url,
        previewUrl: undefined,
      };

      await addTrack(playlistId, internalTrack as Track);

      Alert.alert('Succès', `"${track.title}" ajouté à la playlist`, [
        { text: 'Ajouter plus', style: 'cancel' },
        { text: 'Terminé', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'ajout";
      Alert.alert('Erreur', message);
    } finally {
      setAddingTrackId(null);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTrackItem = ({ item }: { item: SoundCloudTrack }) => {
    const artworkUrl = item.artwork_url || item.user.avatar_url || 'https://via.placeholder.com/50';
    const isAdding = addingTrackId === item.id;

    return (
      <TouchableOpacity
        style={styles.trackItem}
        onPress={() => handleAddTrack(item)}
        disabled={isAdding}
        activeOpacity={0.7}
      >
        <Image source={{ uri: artworkUrl }} style={styles.artwork} />
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.user.username}
          </Text>
          <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, isAdding && styles.addButtonDisabled]}
          onPress={() => handleAddTrack(item)}
          disabled={isAdding}
        >
          {isAdding ? <LoadingSpinner size="small" /> : <Text style={styles.addButtonText}>+</Text>}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher sur SoundCloud..."
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>

      {isSearching && searchResults.length === 0 ? (
        <LoadingSpinner size="large" />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="🎵"
              message={
                query.trim()
                  ? 'Aucune musique trouvée'
                  : 'Recherchez des musiques sur SoundCloud pour les ajouter à votre playlist'
              }
            />
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
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
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
    list: {
      flexGrow: 1,
    },
    trackItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    artwork: {
      width: 56,
      height: 56,
      borderRadius: theme.borders.small,
      backgroundColor: theme.colors.surface,
      marginRight: theme.spacing.md,
    },
    trackInfo: {
      flex: 1,
    },
    trackTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    trackArtist: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    trackDuration: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.md,
    },
    addButtonDisabled: {
      opacity: 0.6,
    },
    addButtonText: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.background,
      lineHeight: 30,
    },
  });
