import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@/store/authStore';
import { Avatar, Button, Card } from '@components/common';

type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
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

        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.label}>Paramètres</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingVertical: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    username: {
      fontSize: 24,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
    },
    displayName: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    bio: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      textAlign: 'center',
      lineHeight: 20,
    },
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    label: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    chevron: {
      fontSize: 20,
      color: theme.colors.textSecondary,
    },
    actions: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    actionButton: {
      marginBottom: theme.spacing.sm,
    },
    footer: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });
