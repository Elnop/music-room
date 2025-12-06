import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES } from '@constants';
import {
  PlaylistsScreen,
  PlaylistDetailScreen,
  CreatePlaylistScreen,
  SearchTracksScreen,
} from '../screens/playlists';
import { ProfileScreen, EditProfileScreen } from '../screens/profile';
import { SpotifyConnectScreen, SpotifySettingsScreen } from '../screens/spotify';

export type AppTabsParamList = {
  HomeTab: undefined;
  PlaylistsTab: undefined;
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
};

const Tab = createBottomTabNavigator<AppTabsParamList>();
const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Placeholder screens for other tabs
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSubtext}>Coming in next phases</Text>
    </View>
  );
}

// Playlist Stack Navigator
function PlaylistsNavigator() {
  return (
    <PlaylistStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
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
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
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
    </ProfileStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.background,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={styles.icon}>🏠</Text>,
        }}
      >
        {() => <PlaceholderScreen title="Home" />}
      </Tab.Screen>

      <Tab.Screen
        name="PlaylistsTab"
        component={PlaylistsNavigator}
        options={{
          title: 'Playlists',
          tabBarIcon: () => <Text style={styles.icon}>🎵</Text>,
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="FriendsTab"
        options={{
          title: 'Friends',
          tabBarIcon: () => <Text style={styles.icon}>👥</Text>,
        }}
      >
        {() => <PlaceholderScreen title="Friends" />}
      </Tab.Screen>

      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text style={styles.icon}>👤</Text>,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
