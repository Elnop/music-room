import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { MusicGenre, MusicPreferences } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi } from '@/services/privacyApi';
import { friendsApi, type MyStats } from '@/services/friendsApi';
import { Avatar } from '@components/common/Avatar';
import { Button } from '@components/common/Button';
import { ProfileSection } from '@components/profile/ProfileSection';
import { GenreChip } from '@components/profile/GenreChip';
import { ThemeSelector } from '@components/theme/ThemeSelector';

type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  MusicPreferences: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, isLoading } = useAuthStore();
  const { accessToken } = useAuthStore();

  const [musicPreferences, setMusicPreferences] = useState<MusicPreferences | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load profile data (music preferences + stats)
  const loadProfileData = useCallback(async () => {
    if (!accessToken) return;

    try {
      const [prefsData, statsData] = await Promise.all([
        privacyApi.getMusicPreferences(accessToken),
        friendsApi.getMyStats(accessToken),
      ]);
      setMusicPreferences(prefsData);
      setStats(statsData);
    } catch (error) {
      // Silently fail - data is optional
      if (__DEV__) {
        console.log('[ProfileScreen] Could not load profile data:', error);
      }
    }
  }, [accessToken]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfileData();
    setIsRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handlePrivacySettings = () => {
    navigation.navigate('PrivacySettings');
  };

  const handleMusicPreferences = () => {
    navigation.navigate('MusicPreferences');
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
              console.error('[ProfileScreen] Logout failed:', error);
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

  const genres = musicPreferences?.genres || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={[theme.colors.primary + '40', theme.colors.background]}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Avatar size="lg" name={user.displayName || user.username} uri={user.avatarUrl} />

            <Text style={styles.username}>@{user.username}</Text>

            {user.displayName && <Text style={styles.displayName}>{user.displayName}</Text>}

            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.followersCount ?? 0}</Text>
                <Text style={styles.statLabel}>Abonnés</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.followingCount ?? 0}</Text>
                <Text style={styles.statLabel}>Abonnements</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Music Preferences Section */}
        <ProfileSection
          title="Music Preferences"
          rightAction={{
            label: 'Edit',
            onPress: handleMusicPreferences,
          }}
        >
          {genres.length > 0 ? (
            <View style={styles.genresContainer}>
              {genres.map((genre: MusicGenre) => (
                <GenreChip key={genre} genre={genre} selected size="sm" />
              ))}
            </View>
          ) : (
            <TouchableOpacity style={styles.emptyState} onPress={handleMusicPreferences}>
              <Text style={styles.emptyStateIcon}>🎵</Text>
              <Text style={styles.emptyStateText}>Add your favorite genres</Text>
              <Text style={styles.emptyStateHint}>Tap to select up to 5 genres</Text>
            </TouchableOpacity>
          )}
        </ProfileSection>

        {/* Profile Info Section */}
        <ProfileSection title="Profile Info">
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>@{user.username}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{new Date(user.createdAt).toLocaleDateString()}</Text>
          </View>
        </ProfileSection>

        {/* Theme Section */}
        <ProfileSection title="Theme">
          <ThemeSelector />
        </ProfileSection>

        {/* Quick Actions Section */}
        <ProfileSection title="Settings">
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacySettings}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuLabel}>Privacy Settings</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleMusicPreferences}>
            <Text style={styles.menuIcon}>🎵</Text>
            <Text style={styles.menuLabel}>Music Preferences</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        </ProfileSection>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button variant="outline" onPress={handleLogout} loading={isLoading}>
            Logout
          </Button>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Music Room v1.0.0</Text>
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
      paddingBottom: theme.spacing.xl,
    },
    heroGradient: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    heroContent: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    username: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    displayName: {
      fontSize: 26,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginTop: theme.spacing.xs,
    },
    bio: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: '80%',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
    },
    statItem: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    statValue: {
      fontSize: 18,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.border,
    },
    genresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    emptyStateIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.sm,
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    emptyStateHint: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    infoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    infoLabel: {
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 15,
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    menuIcon: {
      fontSize: 20,
      marginRight: theme.spacing.sm,
    },
    menuLabel: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    menuChevron: {
      fontSize: 22,
      color: theme.colors.textSecondary,
    },
    logoutSection: {
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    footer: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
    },
  });
