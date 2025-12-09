import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import {
  PlaylistsScreen,
  PlaylistDetailScreen,
  CreatePlaylistScreen,
  SearchTracksScreen,
} from '../screens/playlists';
import { ProfileScreen, EditProfileScreen } from '../screens/profile';
import { SpotifyConnectScreen, SpotifySettingsScreen } from '../screens/spotify';
import { SpotifySearchScreen } from '../screens/search';
import { SettingsScreen } from '../screens/settings';

export type AppTabsParamList = {
  PlaylistsTab: undefined;
  SearchTab: undefined;
  FriendsTab: undefined;
  ProfileTab: undefined;
};

export type PlaylistStackParamList = {
  Playlists: undefined;
  PlaylistDetail: { id: string };
  CreatePlaylist: undefined;
  SearchTracks: { playlistId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  SpotifyConnect: undefined;
  SpotifySettings: undefined;
  Settings: undefined;
};

export type SearchStackParamList = {
  SpotifySearch: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();
const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

// Placeholder screens for other tabs
function PlaceholderScreen({ title }: { title: string }) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSubtext}>Coming in next phases</Text>
    </View>
  );
}

// Playlist Stack Navigator
function PlaylistsNavigator() {
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

// Profile Stack Navigator
function ProfileNavigator() {
  const { theme } = useTheme();

  return (
    <ProfileStack.Navigator
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
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStack.Screen
        name="SpotifyConnect"
        component={SpotifyConnectScreen}
        options={{ title: 'Connect Spotify' }}
      />
      <ProfileStack.Screen
        name="SpotifySettings"
        component={SpotifySettingsScreen}
        options={{ title: 'Spotify Settings' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
    </ProfileStack.Navigator>
  );
}

// Search Stack Navigator
function SearchNavigator() {
  const { theme } = useTheme();

  return (
    <SearchStack.Navigator
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
      <SearchStack.Screen
        name="SpotifySearch"
        component={SpotifySearchScreen}
        options={{ headerShown: false }}
      />
    </SearchStack.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: theme.borders.thick, // 3px bordure top
          borderTopColor: theme.colors.border, // Noir
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontWeight: theme.typography.weights.semibold,
          fontSize: theme.typography.sizes.xs,
        },
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
      <Tab.Screen
        name="PlaylistsTab"
        component={PlaylistsNavigator}
        options={{
          title: 'Playlists',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🎵</Text>,
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="SearchTab"
        component={SearchNavigator}
        options={{
          title: 'Search',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🔍</Text>,
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="FriendsTab"
        options={{
          title: 'Friends',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👥</Text>,
        }}
      >
        {() => <PlaceholderScreen title="Friends" />}
      </Tab.Screen>

      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    placeholderText: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: 8,
    },
    placeholderSubtext: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
  });
