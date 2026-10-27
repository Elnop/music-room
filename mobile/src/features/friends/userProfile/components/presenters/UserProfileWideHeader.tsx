import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
	WideProfileHeader,
	wideProfileActionStyle,
} from '@/shared/components/profile/WideProfileHeader';
import { Button } from '@/shared/components/ui/Button';
import { useShareLink } from '@/shared/hooks/useShareLink';
import { userLink } from '@/shared/utils/shareLinks';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';
import type { UserProfileHeaderProps } from '@/features/friends/types';
import { HiddenFieldNote } from './HiddenFieldNote';
import { UserProfileBadges } from './UserProfileBadges';
import { createUserProfileHeaderStyles } from './userProfileHeaderStyles';
import { Text } from '@/shared/components/ui/Text';

type UserProfileWideHeaderProps = Pick<
	UserProfileHeaderProps,
	'userId' | 'profile' | 'followStatus' | 'isFollowLoading' | 'onFollowToggle' | 'canControlMusic'
> & { hasDevicesOnline: boolean };

export function UserProfileWideHeader({
	userId,
	profile,
	followStatus,
	isFollowLoading,
	onFollowToggle,
	canControlMusic,
	hasDevicesOnline,
}: UserProfileWideHeaderProps) {
	const { theme, styles } = useThemedStyles(createStyles);
	const noteStyles = React.useMemo(() => createUserProfileHeaderStyles(theme), [theme]);
	const name = profile.displayName || profile.username;
	const share = useShareLink(userLink(userId), name);
	const isFriend = followStatus?.isFriend ?? false;

	return (
		<WideProfileHeader
			kind={isFriend ? 'Ami' : 'Profil'}
			name={name}
			username={profile.username}
			avatarUrl={profile.avatarUrl}
			bio={profile.bio}
			followersCount={followStatus?.followersCount ?? 0}
			followingCount={followStatus?.followingCount ?? 0}
			badges={
				<UserProfileBadges
					followStatus={followStatus}
					canControlMusic={canControlMusic}
					hasDevicesOnline={hasDevicesOnline}
				/>
			}
			notes={
				<>
					{profile.bio === undefined && (
						<HiddenFieldNote label={isFriend ? 'Bio privée' : 'Visible uniquement par ses amis'} />
					)}
					{followStatus?.isFollowedBy && !followStatus.isFollowing && (
						<Text style={noteStyles.followBackHint}>
							Suivez cet utilisateur en retour pour devenir amis.
						</Text>
					)}
				</>
			}
			actions={
				<>
					{followStatus && (
						<Button
							variant={followStatus.isFollowing ? 'secondary' : 'primary'}
							onPress={onFollowToggle}
							loading={isFollowLoading}
							style={styles.action}
							accessibilityLabel={followStatus.isFollowing ? 'Ne plus suivre' : 'Suivre'}
							icon={
								<Ionicons
									name={followStatus.isFollowing ? 'checkmark' : 'person-add-outline'}
									size={18}
									color={followStatus.isFollowing ? theme.colors.text : theme.colors.onColor}
								/>
							}
						>
							{followStatus.isFollowing ? 'Abonné' : 'Suivre'}
						</Button>
					)}
					<Button
						variant="secondary"
						onPress={share}
						style={styles.action}
						icon={<Ionicons name="share-social-outline" size={18} color={theme.colors.text} />}
					>
						Partager
					</Button>
				</>
			}
		/>
	);
}

const createStyles = (theme: Theme) => StyleSheet.create({ action: wideProfileActionStyle(theme) });
