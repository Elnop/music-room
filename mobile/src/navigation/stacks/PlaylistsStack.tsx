/**
 * Playlists Feature Navigation Stack
 *
 * This file contains all navigation configuration for the Playlists feature.
 * Developers working on playlists can modify this file without conflicts with other features.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@contexts';
import { PlaylistsScreen } from '../../screens/playlists/PlaylistsScreen';
import { PlaylistDetailScreen } from '../../screens/playlists/PlaylistDetailScreen';
import { CreatePlaylistScreen } from '../../screens/playlists/CreatePlaylistScreen';
import { SearchTracksScreen } from '../../screens/playlists/SearchTracksScreen';

export type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
};

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList>();

export function PlaylistsNavigator() {
  const { theme } = useTheme();

  return (
    <PlaylistStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomWidth: theme.borders.medium,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: theme.typography.weights.bold,
        },
      }}
    >
      <PlaylistStack.Screen
        name="Playlists"
        component={PlaylistsScreen}
        options={{ headerShown: false }}
      />
      <PlaylistStack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={{ title: 'Playlist' }}
      />
      <PlaylistStack.Screen
        name="CreatePlaylist"
        component={CreatePlaylistScreen}
        options={{ title: 'New Playlist' }}
      />
      <PlaylistStack.Screen
        name="SearchTracks"
        component={SearchTracksScreen}
        options={{ title: 'Add Tracks' }}
      />
    </PlaylistStack.Navigator>
  );
}
