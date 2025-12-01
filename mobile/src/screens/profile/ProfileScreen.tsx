import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/authStore';
import { Avatar, Button, Card } from '@components/common';
import { COLORS, SPACING } from '@constants';

type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, isLoading } = useAuthStore();

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.header}>
        <Avatar
          size="lg"
          name={user.displayName || user.username}
          imageUrl={user.avatarUrl}
        />
        <Text style={styles.username}>{user.username}</Text>
        {user.displayName && (
          <Text style={styles.displayName}>{user.displayName}</Text>
        )}
        {user.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}
      </View>

      {/* Profile Info Card */}
      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Spotify</Text>
          <View style={styles.spotifyBadge}>
            <Text style={styles.spotifyText}>
              {user.spotifyConnected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="primary"
          onPress={handleEditProfile}
          style={styles.actionButton}
        >
          Edit Profile
        </Button>

        <Button
          variant="outline"
          onPress={handleLogout}
          loading={isLoading}
          style={styles.actionButton}
        >
          Logout
        </Button>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Music Room v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingVertical: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  displayName: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  bio: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  spotifyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  spotifyText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
