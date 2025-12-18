/**
 * Search Feature Navigation Stack
 *
 * This file contains all navigation configuration for the Search feature.
 * Developers working on search can modify this file without conflicts with other features.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@contexts';
import { SoundCloudSearchScreen } from '../../screens/search/SoundCloudSearchScreen';

export type SearchStackParamList = {
  Search: undefined;
};

const SearchStack = createNativeStackNavigator<SearchStackParamList>();

export function SearchNavigator() {
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
        name="Search"
        component={SoundCloudSearchScreen}
        options={{ headerShown: false }}
      />
    </SearchStack.Navigator>
  );
}
