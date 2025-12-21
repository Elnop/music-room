/**
 * Friends Feature Navigation Stack
 *
 * This file contains all navigation configuration for the Friends feature.
 * Developers working on friends can modify this file without conflicts with other features.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@contexts';
import { FriendsScreen } from '../../screens/friends/FriendsScreen';
import { UserProfileScreen } from '../../screens/friends/UserProfileScreen';

export type FriendsStackParamList = {
  Friends: undefined;
  UserProfile: { userId: string };
};

const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();

export function FriendsNavigator() {
  const { theme } = useTheme();

  return (
    <FriendsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: theme.typography.weights.bold,
        },
      }}
    >
      <FriendsStack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ headerShown: false }}
      />
      <FriendsStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
    </FriendsStack.Navigator>
  );
}

