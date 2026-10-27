import React from 'react';
import { View } from 'react-native';
import { Avatar } from '@/shared/components/media/Avatar';
import { GenreChip } from '@/shared/components/ui/GenreChip';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FilteredProfile, FollowStatus, MusicGenre } from '@/features/friends/types';
import { createUserProfileHeaderStyles } from './userProfileHeaderStyles';
import { HiddenFieldNote } from './HiddenFieldNote';
import { UserProfileBadges } from './UserProfileBadges';
import { Text } from '@/shared/components/ui/Text';

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
					<UserProfileBadges
						followStatus={followStatus}
						canControlMusic={canControlMusic}
						hasDevicesOnline={hasDevicesOnline}
					/>
				</View>
				{profile.displayName && <Text style={styles.displayName}>{profile.displayName}</Text>}
				{followStatus?.isFollowedBy && !followStatus.isFollowing && (
					<Text style={styles.followBackHint}>
						Suivez cet utilisateur en retour pour devenir amis.
					</Text>
				)}
			</View>

			{isBioHidden ? (
				<HiddenFieldNote label={isFriend ? 'Bio privée' : 'Visible uniquement par ses amis'} />
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
