/**
 * Profile Feature Navigation Stack
 *
 * This file contains all navigation configuration for the Profile feature.
 * Developers working on profile can modify this file without conflicts with other features.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { PrivacySettingsScreen } from '@/screens/profile/PrivacySettingsScreen';
import { MusicPreferencesScreen } from '@/screens/profile/MusicPreferencesScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  PrivacySettings: undefined;
  MusicPreferences: undefined;
  Settings: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  const { theme } = useTheme();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        contentStyle: {
          borderTopWidth: theme.borders.medium,
          borderTopColor: theme.colors.border,
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
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{ title: 'Privacy' }}
      />
      <ProfileStack.Screen
        name="MusicPreferences"
        component={MusicPreferencesScreen}
        options={{ title: 'Music Preferences' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
    </ProfileStack.Navigator>
  );
}
