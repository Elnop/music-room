import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { privacyApi } from '@/services/privacyApi';
import { friendsApi, type FollowStatus } from '@/services/friendsApi';
import { playlistApi } from '@/api/playlistApi';
import { musicControlApi } from '@/services/musicControlApi';
import { useFriendListening } from '@/hooks/useMusicControl';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { GenreChip } from '@/components/profile/GenreChip';
import { NowPlayingInline } from '@/components/profile/NowPlayingInline';
import type { Playlist } from '@/types/playlist.types';
import type { FilteredProfile } from '@/types/user.types';
import type { MusicGenre } from '@/types/user.types';
import type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

type Props = NativeStackScreenProps<FriendsStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { accessToken } = useAuthStore();

  const [profile, setProfile] = useState<FilteredProfile | null>(null);
  const [filteredProfile, setFilteredProfile] = useState<FilteredProfile | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialCanControl, setInitialCanControl] = useState(false);

  const {
    devices,
    canControl: canControlMusic,
    remotePlay,
    remotePause,
    isLoading: isListeningLoading,
  } = useFriendListening(userId, initialCanControl);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        const [profileData, filteredData, statusData, playlistsData, canControl] =
          await Promise.all([
            profileApi.getUserProfile(accessToken, userId),
            privacyApi.getFilteredProfile(accessToken, userId),
            friendsApi.getFollowStatus(accessToken, userId),
            playlistApi.fetchUserPublicPlaylists(userId),
            musicControlApi.canControl(userId),
          ]);
        setProfile(profileData);
        setFilteredProfile(filteredData);
        setFollowStatus(statusData);
        setPlaylists(playlistsData);
        setInitialCanControl(canControl);
      } catch (error) {
        console.error('[UserProfileScreen] Load profile failed:', error);
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
      console.error('[UserProfile] Follow toggle failed', {
        error: err,
        userId,
        isFollowing: followStatus?.isFollowing,
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement du profil..." />;
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Profil introuvable'}</Text>
        </View>
      </View>
    );
  }

  const isFriend = followStatus?.isFriend ?? false;

  // Privacy logic: undefined = hidden by privacy, value present = visible (even if empty)
  const isAvatarHidden = filteredProfile?.avatarUrl === undefined;
  const isBioHidden = filteredProfile?.bio === undefined;
  const isMusicPrefsHidden = filteredProfile?.musicPreferences === undefined;

  const genres = filteredProfile?.musicPreferences || [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            {isAvatarHidden ? (
              <View style={styles.hiddenAvatar}>
                <Ionicons name="lock-closed" size={32} color={theme.colors.textSecondary} />
              </View>
            ) : (
              <Avatar
                size="lg"
                name={profile.displayName || profile.username}
                uri={filteredProfile?.avatarUrl}
              />
            )}

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
              {followStatus?.isFriend && canControlMusic && (
                <View style={[styles.statusBadge, devices.length > 0 && styles.statusBadgeOnline]}>
                  <View style={[styles.statusDot, devices.length > 0 && styles.statusDotOnline]} />
                  <Text style={[styles.statusText, devices.length > 0 && styles.statusTextOnline]}>
                    {devices.length > 0 ? 'En ligne' : 'Hors ligne'}
                  </Text>
                </View>
              )}
              {followStatus?.isFollowedBy && (
                <View style={styles.followsYouBadge}>
                  <Text style={styles.followsYouText}>Vous suit</Text>
                </View>
              )}
            </View>
            {profile.displayName && <Text style={styles.displayName}>{profile.displayName}</Text>}
          </View>

          {/* Bio - with privacy check */}
          {isBioHidden ? (
            <View style={styles.hiddenField}>
              <Ionicons
                name="lock-closed"
                size={16}
                color={theme.colors.textSecondary}
                style={styles.hiddenIcon}
              />
              <Text style={styles.hiddenText}>
                {isFriend ? 'Bio privée' : 'Visible uniquement pour les amis'}
              </Text>
            </View>
          ) : filteredProfile?.bio ? (
            <Text style={styles.bio}>{filteredProfile.bio}</Text>
          ) : null}

          {/* Genres - inline sans encart, masqué si vide ou privé */}
          {!isMusicPrefsHidden && genres.length > 0 && (
            <View style={styles.genresInline}>
              {genres.map((genre: MusicGenre) => (
                <GenreChip key={genre} genre={genre} selected size="sm" />
              ))}
            </View>
          )}

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

          {/* Écoute en cours - affiche seulement si un track est en cours */}
          {canControlMusic &&
            followStatus?.isFriend &&
            !isListeningLoading &&
            devices
              .filter(d => d.track)
              .map(deviceStatus => (
                <NowPlayingInline
                  key={deviceStatus.device.deviceId}
                  track={deviceStatus.track!}
                  isPlaying={deviceStatus.isPlaying}
                  onPlay={() => remotePlay(deviceStatus.device.deviceId)}
                  onPause={() => remotePause(deviceStatus.device.deviceId)}
                />
              ))}
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
    </View>
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
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 3,
      borderRadius: 12,
      gap: 4,
    },
    statusBadgeOnline: {
      backgroundColor: theme.colors.success + '20',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textSecondary,
    },
    statusDotOnline: {
      backgroundColor: theme.colors.success,
    },
    statusText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: theme.typography.weights.medium,
    },
    statusTextOnline: {
      color: theme.colors.success,
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
    hiddenField: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      gap: 6,
    },
    hiddenIcon: {
      marginRight: 4,
    },
    hiddenText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    hiddenAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    genresInline: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.md,
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
      paddingHorizontal: theme.spacing.md,
    },
    emptyPlaylists: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
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
