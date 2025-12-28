import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useImageColors, hexToRgba } from '@/hooks/useImageColors';
import type { Theme } from '@themes/types';
import type { MusicGenre, MusicPreferences } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';
import { privacyApi } from '@/services/privacyApi';
import { friendsApi, type MyStats } from '@/services/friendsApi';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@components/common/Avatar';
import { FloatingHeader } from '@/components/common/FloatingHeader';
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
  const insets = useSafeAreaInsets();
  const playerHeight = usePlayerHeight();
  const styles = React.useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, isLoading, accessToken, isAuthenticated } = useAuthStore();

  const [musicPreferences, setMusicPreferences] = useState<MusicPreferences | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get avatar URL for color extraction
  const avatarUrl = user?.avatarUrl;
  const { dominantColor } = useImageColors(avatarUrl, theme.colors.primary);

  // Gradient colors based on avatar
  const gradientColors = dominantColor
    ? ([
        hexToRgba(dominantColor, 0.6),
        hexToRgba(dominantColor, 0.3),
        theme.colors.background,
      ] as const)
    : ([theme.colors.primary + '40', theme.colors.background, theme.colors.background] as const);

  // Load profile data (music preferences + stats)
  const loadProfileData = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;

    try {
      const [prefsData, statsData] = await Promise.all([
        privacyApi.getMusicPreferences(accessToken),
        friendsApi.getMyStats(accessToken),
      ]);
      if (useAuthStore.getState().isAuthenticated) {
        setMusicPreferences(prefsData);
        setStats(statsData);
      }
    } catch {
      // Silently fail - data is optional and errors during logout are expected
    }
  }, [accessToken, isAuthenticated]);

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('[ProfileScreen] Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  const genres = musicPreferences?.genres || [];

  return (
    <View style={styles.container}>
      {/* Full screen gradient */}
      <LinearGradient
        colors={gradientColors as unknown as [string, string, ...string[]]}
        locations={[0, 0.3, 0.6]}
        style={styles.gradientBackground}
      />

      {/* Floating header with edit button */}
      <FloatingHeader
        title="Mon Profil"
        titleAlign="left"
        showBackButton={false}
        rightIcon="settings-outline"
        onRightPress={handleEditProfile}
        showRightButton
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: playerHeight + theme.spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Hero Section */}
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

        {/* Music Preferences Section */}
        <ProfileSection
          title="Préférences musicales"
          rightAction={{
            label: 'Modifier',
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
              <Ionicons
                name="musical-notes-outline"
                size={32}
                color={theme.colors.textSecondary}
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateText}>Ajoutez vos genres favoris</Text>
              <Text style={styles.emptyStateHint}>Appuyez pour sélectionner jusqu'à 5 genres</Text>
            </TouchableOpacity>
          )}
        </ProfileSection>

        {/* Profile Info Section */}
        <ProfileSection title="Informations">
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nom d'utilisateur</Text>
            <Text style={styles.infoValue}>@{user.username}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </ProfileSection>

        {/* Theme Section */}
        <ProfileSection title="Thème">
          <ThemeSelector />
        </ProfileSection>

        {/* Privacy Settings Button */}
        <View style={styles.privacyButtonContainer}>
          <TouchableOpacity style={styles.privacyButton} onPress={handlePrivacySettings}>
            <View style={styles.privacyIconContainer}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyTitle}>Confidentialité</Text>
              <Text style={styles.privacySubtitle}>Gérez qui peut voir vos informations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoading}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Zumik v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 350,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingTop: topInset + 10, // Space for floating header
      paddingBottom: theme.spacing.xl,
    },
    heroContent: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
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
      marginBottom: theme.spacing.sm,
      opacity: 0.6,
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
    privacyButtonContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    privacyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      borderRadius: 16,
    },
    privacyIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    privacyTextContainer: {
      flex: 1,
    },
    privacyTitle: {
      fontSize: 16,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    privacySubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    logoutSection: {
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.lg,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#DC2626',
      backgroundColor: 'transparent',
    },
    logoutText: {
      fontSize: 16,
      fontWeight: theme.typography.weights.semibold,
      color: '#DC2626',
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
