import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import {
	WideProfileHeader,
	wideProfileActionStyle,
} from '@/features/user/shared/wide-profile-header/WideProfileHeader';
import { Button } from '@/shared/theme/components/Button';
import { useShareLink } from '@/shared/theme/hooks/useShareLink';
import { userLink } from '@/shared/share-links/shareLinks';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/lib/types';
import type { UserProfileHeaderProps } from '@/features/user/features/friends/types';
import { HiddenFieldNote } from '@/features/user/features/friends/features/user-profile/components/presenters/HiddenFieldNote';
import { UserProfileBadges } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileBadges';
import { createUserProfileHeaderStyles } from '@/features/user/features/friends/features/user-profile/lib/userProfileHeaderStyles';
import { Text } from '@/shared/theme/components/Text';
import CheckSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/check-solid.svg';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';
import UserPlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/user-plus-solid.svg';

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
								<PixelIcon
									icon={followStatus.isFollowing ? CheckSolid : UserPlusSolid}
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
						icon={<PixelIcon icon={ShareSolid} size={18} color={theme.colors.text} />}
					>
						Partager
					</Button>
				</>
			}
		/>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({ action: wideProfileActionStyle(theme) });
}
