import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { Avatar } from '@/components/common/Avatar';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserProfile } from '@/types';
import type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

type Props = NativeStackScreenProps<FriendsStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { accessToken } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await profileApi.getUserProfile(accessToken, userId);
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, accessToken]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Avatar
            size="lg"
            name={profile.displayName || profile.username}
            imageUrl={profile.avatarUrl}
          />
          <Text style={styles.username}>{profile.username}</Text>
          {profile.displayName && (
            <Text style={styles.displayName}>{profile.displayName}</Text>
          )}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>

        {/* Profile Info Card */}
        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{profile.username}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Member Since</Text>
            <Text style={styles.value}>
              {new Date(profile.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Card>
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
  });

