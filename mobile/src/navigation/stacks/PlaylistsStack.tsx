/**
 * Playlists Feature Navigation Stack
 *
 * Architecture:
 * - Toutes les pages utilisent le header natif avec effet liquid glass sur iOS
 * - Pages avec gradient: header transparent (headerTransparent: true)
 */

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import { PlaylistsScreen } from '@/screens/playlists/PlaylistsScreen';
import { PlaylistDetailScreen } from '@/screens/playlists/PlaylistDetailScreen';
import { CreatePlaylistScreen } from '@/screens/playlists/CreatePlaylistScreen';
import { SearchTracksScreen } from '@/screens/playlists/SearchTracksScreen';
import { PlaylistSharingScreen } from '@/screens/playlists/PlaylistSharingScreen';

export type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
  PlaylistSharing: { playlistId: string };
};

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList>();

export function PlaylistsNavigator() {
  const { theme } = useTheme();

  return (
    <PlaylistStack.Navigator
      screenOptions={{
        // Header opaque avec effet blur natif sur iOS
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: theme.typography.weights.bold,
        },
        headerTitleAlign: 'center',
        headerLargeTitle: false,
      }}
    >
      <PlaylistStack.Screen
        name="Playlists"
        component={PlaylistsScreen}
        options={{ title: 'Playlists' }}
      />
      <PlaylistStack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
        options={{
          headerTransparent: true,
          headerBlurEffect: undefined,
          headerStyle: { backgroundColor: 'transparent' },
          title: '',
        }}
      />
      <PlaylistStack.Screen
        name="CreatePlaylist"
        component={CreatePlaylistScreen}
        options={{ title: 'Nouvelle Playlist' }}
      />
      <PlaylistStack.Screen
        name="SearchTracks"
        component={SearchTracksScreen}
        options={{ title: 'Ajouter des titres' }}
      />
      <PlaylistStack.Screen
        name="PlaylistSharing"
        component={PlaylistSharingScreen}
        options={{ title: 'Partage' }}
      />
    </PlaylistStack.Navigator>
  );
}
