/**
 * Main App Navigator
 *
 * This file orchestrates the bottom tab navigation for authenticated users.
 * Individual feature stacks are defined in navigation/stacks/ to avoid merge conflicts.
 *
 * To add a new tab:
 * 1. Create your stack in navigation/stacks/YourFeatureStack.tsx
 * 2. Import it here
 * 3. Add a Tab.Screen below
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';

// Import feature stacks (each feature owns its navigation)
import { PlaylistsNavigator } from './stacks/PlaylistsStack';
import { ProfileNavigator } from './stacks/ProfileStack';
import { SearchNavigator } from './stacks/SearchStack';
import { FriendsNavigator } from './stacks/FriendsStack';

// Player components
import { MiniPlayer } from '../components/player/MiniPlayer';
import { PlayerModal } from '../components/player/PlayerModal';
import { PlayerProvider } from '../contexts/PlayerContext';

// Tab navigation types
export type AppTabsParamList = {
  PlaylistsTab: undefined;
  SearchTab: undefined;
  FriendsTab: undefined;
  ProfileTab: undefined;
};

// Re-export stack param lists for type safety
export type { PlaylistStackParamList } from './stacks/PlaylistsStack';
export type { ProfileStackParamList } from './stacks/ProfileStack';
export type { SearchStackParamList } from './stacks/SearchStack';
export type { FriendsStackParamList } from './stacks/FriendsStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

/**
 * Main App Navigator - Bottom Tabs
 *
 * Features are organized as separate stack navigators in navigation/stacks/
 * This structure prevents merge conflicts when multiple developers add features.
 */
export function AppNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <PlayerProvider>
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopWidth: theme.borders.thick,
              borderTopColor: theme.colors.border,
              height: 60 + insets.bottom,
              paddingBottom: insets.bottom + 8,
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
          {/* Playlists Tab */}
          <Tab.Screen
            name="PlaylistsTab"
            component={PlaylistsNavigator}
            options={{
              title: 'Playlists',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🎵</Text>,
              headerShown: false,
            }}
          />

          {/* Search Tab */}
          <Tab.Screen
            name="SearchTab"
            component={SearchNavigator}
            options={{
              title: 'Search',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🔍</Text>,
              headerShown: false,
            }}
          />

          {/* Friends Tab */}
          <Tab.Screen
            name="FriendsTab"
            component={FriendsNavigator}
            options={{
              title: 'Friends',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>👥</Text>,
              headerShown: false,
            }}
          />

          {/* Profile Tab */}
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

        {/* Mini Player - appears above tab bar */}
        <MiniPlayer />

        {/* Full Player Modal */}
        <PlayerModal />
      </View>
    </PlayerProvider>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
    },
    placeholderText: {
      fontSize: theme.typography.sizes['2xl'],
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    placeholderSubtext: {
      fontSize: theme.typography.sizes.base,
      color: theme.colors.textSecondary,
    },
  });
