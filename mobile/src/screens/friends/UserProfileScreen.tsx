import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@contexts';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { friendsApi, type FollowStatus } from '@/services/friendsApi';
import { playlistApi } from '@/api/playlistApi';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import type { UserProfile, Playlist } from '@/types';
import type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

type Props = NativeStackScreenProps<FriendsStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { accessToken } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        const [profileData, statusData, playlistsData] = await Promise.all([
          profileApi.getUserProfile(accessToken, userId),
          friendsApi.getFollowStatus(accessToken, userId),
          playlistApi.fetchUserPublicPlaylists(userId),
        ]);
        setProfile(profileData);
        setFollowStatus(statusData);
        setPlaylists(playlistsData);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, accessToken]);

  const handleFollowToggle = async () => {
    if (!accessToken || !followStatus) return;

    setIsFollowLoading(true);
    try {
      if (followStatus.isFollowing) {
        const result = await friendsApi.unfollowUser(accessToken, userId);
        setFollowStatus(result.status);
      } else {
        const result = await friendsApi.followUser(accessToken, userId);
        setFollowStatus(result.status);
      }
    } catch (err) {
      console.error('[UserProfile] Follow toggle failed:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Avatar
              size="lg"
              name={profile.displayName || profile.username}
              uri={profile.avatarUrl}
            />

            {followStatus && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followStatus.followersCount}</Text>
                  <Text style={styles.statLabel}>Abonnés</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followStatus.followingCount}</Text>
                  <Text style={styles.statLabel}>Abonnements</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.nameSection}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{profile.username}</Text>
              {followStatus?.isFollowedBy && (
                <View style={styles.followsYouBadge}>
                  <Text style={styles.followsYouText}>Vous suit</Text>
                </View>
              )}
            </View>
            {profile.displayName && <Text style={styles.displayName}>{profile.displayName}</Text>}
          </View>

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {followStatus && (
            <View style={styles.actionButtons}>
              {followStatus.isFriend ? (
                <>
                  <View style={styles.friendBadge}>
                    <Text style={styles.friendBadgeText}>Amis</Text>
                  </View>
                  <Button
                    variant="outline"
                    onPress={handleFollowToggle}
                    loading={isFollowLoading}
                    style={styles.actionButton}
                  >
                    Abonné
                  </Button>
                </>
              ) : followStatus.isFollowing ? (
                <Button
                  variant="outline"
                  onPress={handleFollowToggle}
                  loading={isFollowLoading}
                  style={styles.fullWidthButton}
                >
                  Abonné
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onPress={handleFollowToggle}
                  loading={isFollowLoading}
                  style={styles.fullWidthButton}
                >
                  Suivre
                </Button>
              )}
            </View>
          )}
        </View>

        <View style={styles.playlistsSection}>
          <Text style={styles.sectionTitle}>Playlists</Text>
          {playlists.length === 0 ? (
            <Text style={styles.emptyPlaylists}>Aucune playlist</Text>
          ) : (
            playlists.map(playlist => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                trackCount={playlist.trackCount}
                ownerName={profile.username}
                onPress={() => {
                  navigation.navigate('PlaylistDetail', { id: playlist.id });
                }}
              />
            ))
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Membre depuis{' '}
            {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
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
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    statsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    nameSection: {
      marginTop: theme.spacing.md,
    },
    usernameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    username: {
      fontSize: 16,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    followsYouBadge: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    followsYouText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
    },
    displayName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    bio: {
      fontSize: 14,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
      lineHeight: 20,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
    },
    fullWidthButton: {
      flex: 1,
    },
    friendBadge: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    friendBadgeText: {
      color: theme.colors.surface,
      fontWeight: theme.typography.weights.semibold,
      fontSize: 14,
    },
    playlistsSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    emptyPlaylists: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
    },
    infoSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: theme.spacing.lg,
    },
    infoText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
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
