import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/shared/components/media/Avatar';
import { GenreChip } from '@/components/profile/GenreChip';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FilteredProfile, FollowStatus, MusicGenre } from '@/features/friends/types';
import { createUserProfileHeaderStyles } from './userProfileHeaderStyles';

interface UserProfileInfoProps {
	profile: FilteredProfile;
	followStatus: FollowStatus | null;
	canControlMusic: boolean;
	hasDevicesOnline: boolean;
}

export function UserProfileInfo({
	profile,
	followStatus,
	canControlMusic,
	hasDevicesOnline,
}: UserProfileInfoProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createUserProfileHeaderStyles(theme), [theme]);
	const isFriend = followStatus?.isFriend ?? false;
	const isBioHidden = profile.bio === undefined;
	const isMusicPrefsHidden = profile.musicPreferences === undefined;
	const genres = profile.musicPreferences || [];

	return (
		<>
			<View style={styles.topRow}>
				<Avatar size="lg" name={profile.displayName || profile.username} uri={profile.avatarUrl} />
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
						<View style={[styles.statusBadge, hasDevicesOnline && styles.statusBadgeOnline]}>
							<View style={[styles.statusDot, hasDevicesOnline && styles.statusDotOnline]} />
							<Text style={[styles.statusText, hasDevicesOnline && styles.statusTextOnline]}>
								{hasDevicesOnline ? 'En ligne' : 'Hors ligne'}
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
				{followStatus?.isFollowedBy && !followStatus.isFollowing && (
					<Text style={styles.followBackHint}>
						Suivez cet utilisateur en retour pour devenir amis.
					</Text>
				)}
			</View>

			{isBioHidden ? (
				<View style={styles.hiddenField}>
					<Ionicons
						name="lock-closed"
						size={16}
						color={theme.colors.textSecondary}
						style={styles.hiddenIcon}
					/>
					<Text style={styles.hiddenText}>
						{isFriend ? 'Bio privée' : 'Visible uniquement par ses amis'}
					</Text>
				</View>
			) : profile.bio ? (
				<Text style={styles.bio}>{profile.bio}</Text>
			) : null}

			{!isMusicPrefsHidden && genres.length > 0 && (
				<View style={styles.genresInline}>
					{genres.map((genre: MusicGenre) => (
						<GenreChip key={genre} genre={genre} selected size="sm" />
					))}
				</View>
			)}
		</>
	);
}
